import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './job.entity';
import { JobStatus, JobType, QUEUE_NAME } from './job.enums';

export interface JobPayload {
  jobId: string;
  type: JobType;
  value: number;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobs: Repository<Job>,
    @InjectQueue(QUEUE_NAME)
    private readonly queue: Queue<JobPayload>,
  ) {}

  // Persist a QUEUED record, enqueue the work, and return immediately.
  // Processing is fully decoupled from this HTTP response.
  async create(dto: CreateJobDto): Promise<Job> {
    const job = await this.jobs.save(
      this.jobs.create({
        type: dto.type,
        status: JobStatus.QUEUED,
        input: { value: dto.value },
        result: null,
        error: null,
      }),
    );

    await this.queue.add(job.type, {
      jobId: job.id,
      type: job.type,
      value: dto.value,
    });

    return job;
  }

  // Re-run a failed (dead-lettered) job: reset it to QUEUED, clear the
  // previous outcome, and enqueue the same work again under its existing id.
  async retry(id: string): Promise<Job> {
    const job = await this.findOne(id);
    if (job.status !== JobStatus.FAILED) {
      throw new BadRequestException(`Job ${id} is not in a failed state`);
    }

    job.status = JobStatus.QUEUED;
    job.error = null;
    job.result = null;
    job.startedAt = null;
    job.finishedAt = null;
    await this.jobs.save(job);

    await this.queue.add(job.type, {
      jobId: job.id,
      type: job.type,
      value: job.input.value,
    });

    return job;
  }

  findAll(): Promise<Job[]> {
    return this.jobs.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobs.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }
    return job;
  }
}
