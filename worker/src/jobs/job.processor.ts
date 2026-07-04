import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { JobStatus, JobType, QUEUE_NAME } from './job.enums';
import { JobHandlerRegistry } from './job-handler.registry';

export interface JobPayload {
  jobId: string;
  type: JobType;
  value: number;
}

const CONCURRENCY = process.env.WORKER_CONCURRENCY
  ? Number(process.env.WORKER_CONCURRENCY)
  : 5;

@Processor(QUEUE_NAME, { concurrency: CONCURRENCY })
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobs: Repository<Job>,
    private readonly registry: JobHandlerRegistry,
  ) {
    super();
  }

  async process(job: BullJob<JobPayload>): Promise<unknown> {
    const { jobId, type, value } = job.data;
    this.logger.log(`Processing job ${jobId} (type=${type})`);

    await this.jobs.update(jobId, {
      status: JobStatus.RUNNING,
      startedAt: new Date(),
    });

    try {
      const handler = this.registry.resolve(type);
      const result = await handler.handle({ value });

      await this.jobs.update(jobId, {
        status: JobStatus.COMPLETED,
        result,
        finishedAt: new Date(),
      });
      this.logger.log(`Completed job ${jobId}`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.jobs.update(jobId, {
        status: JobStatus.FAILED,
        error: message,
        finishedAt: new Date(),
      });
      this.logger.error(`Failed job ${jobId}: ${message}`);
      throw err;
    }
  }
}
