import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { LessThan, Repository } from 'typeorm';
import { Job } from './job.entity';
import { JobStatus, JobType, QUEUE_NAME } from './job.enums';
import { JobPayload } from './jobs.service';

const INTERVAL_MS = Number(process.env.RECONCILE_INTERVAL_MS ?? 15_000);
// A QUEUED row older than this that is not in the queue was likely never
// enqueued (crash between save() and queue.add()).
const ORPHAN_QUEUED_MS = Number(process.env.RECONCILE_ORPHAN_MS ?? 30_000);
// A RUNNING row older than this belongs to a worker that never finished
// (crashed mid-flight). Keep this comfortably larger than the longest job.
const ZOMBIE_RUNNING_MS = Number(process.env.RECONCILE_ZOMBIE_MS ?? 60_000);

@Injectable()
export class JobReconciliationService {
  private readonly logger = new Logger(JobReconciliationService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobs: Repository<Job>,
    @InjectQueue(QUEUE_NAME)
    private readonly queue: Queue<JobPayload>,
  ) {}

  @Interval('job-reconciliation', INTERVAL_MS)
  async reconcile(): Promise<void> {
    try {
      await this.reEnqueueOrphans();
      await this.recoverZombies();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Reconciliation sweep failed: ${message}`);
    }
  }

  // Dual-write safety net: a job persisted as QUEUED whose enqueue never
  // landed. Re-adding with the DB id as the BullMQ job id is idempotent —
  // BullMQ ignores the add if the job is already queued/active, so jobs that
  // are simply waiting in a backlog are not duplicated.
  private async reEnqueueOrphans(): Promise<void> {
    const cutoff = new Date(Date.now() - ORPHAN_QUEUED_MS);
    const orphans = await this.jobs.find({
      where: { status: JobStatus.QUEUED, updatedAt: LessThan(cutoff) },
      take: 100,
    });
    for (const job of orphans) {
      await this.enqueue(job);
      this.logger.warn(`Re-enqueued orphaned queued job ${job.id}`);
    }
  }

  // Zombie recovery: a job stuck RUNNING past the timeout (worker crashed
  // after claiming it). Reset it to QUEUED and re-enqueue so it runs again.
  private async recoverZombies(): Promise<void> {
    const cutoff = new Date(Date.now() - ZOMBIE_RUNNING_MS);
    const zombies = await this.jobs.find({
      where: { status: JobStatus.RUNNING, startedAt: LessThan(cutoff) },
      take: 100,
    });
    for (const job of zombies) {
      const reset = await this.jobs.update(
        { id: job.id, status: JobStatus.RUNNING },
        { status: JobStatus.QUEUED, startedAt: null, finishedAt: null },
      );
      if (reset.affected) {
        await this.enqueue(job);
        this.logger.warn(`Recovered zombie running job ${job.id}`);
      }
    }
  }

  private async enqueue(job: Job): Promise<void> {
    await this.queue.add(
      job.type as JobType,
      { jobId: job.id, type: job.type, value: job.input.value },
      { jobId: job.id },
    );
  }
}
