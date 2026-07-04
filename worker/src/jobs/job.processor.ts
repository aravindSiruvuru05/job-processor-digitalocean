import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job as BullJob } from 'bullmq';
import { In, Repository } from 'typeorm';
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

    // Claim the job with a guarded transition. Only a QUEUED or FAILED row
    // (the latter for BullMQ retries) can move to RUNNING. A duplicate or
    // stalled re-delivery of a job that is already RUNNING or COMPLETED
    // affects 0 rows, so we skip it instead of reprocessing or clobbering
    // terminal state — this makes processing idempotent under at-least-once
    // delivery.
    const claim = await this.jobs.update(
      { id: jobId, status: In([JobStatus.QUEUED, JobStatus.FAILED]) },
      {
        status: JobStatus.RUNNING,
        startedAt: new Date(),
        error: null,
        finishedAt: null,
      },
    );
    if (!claim.affected) {
      this.logger.warn(
        `Job ${jobId} not claimable (already running/completed) — skipping duplicate delivery`,
      );
      return;
    }

    this.logger.log(`Processing job ${jobId} (type=${type})`);

    try {
      const handler = this.registry.resolve(type);
      const result = await handler.handle({ value });

      // Only complete if we still own the RUNNING row (guards against a
      // reaper/other worker having taken over in the meantime).
      await this.jobs.update(
        { id: jobId, status: JobStatus.RUNNING },
        { status: JobStatus.COMPLETED, result, finishedAt: new Date() },
      );
      this.logger.log(`Completed job ${jobId}`);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.jobs.update(
        { id: jobId, status: JobStatus.RUNNING },
        { status: JobStatus.FAILED, error: message, finishedAt: new Date() },
      );
      this.logger.error(`Failed job ${jobId}: ${message}`);
      throw err; // let BullMQ apply attempts + backoff
    }
  }
}
