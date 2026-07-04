import { Injectable } from '@nestjs/common';
import { JobInput, JobResult } from '../job.entity';
import { JobType } from '../job.enums';
import { JobHandler } from './job-handler.interface';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class SquareJobHandler implements JobHandler {
  readonly type = JobType.SQUARE;

  private readonly workMs = process.env.WORKER_SLEEP_MS
    ? Number(process.env.WORKER_SLEEP_MS)
    : 5000;

  async handle(input: JobInput): Promise<JobResult> {
    const square = input.value * input.value;
    // Mock work: simulate a slow task.
    await sleep(this.workMs);
    return { square };
  }
}
