import { Injectable } from '@nestjs/common';
import { JobInput, JobResult } from '../job.entity';
import { JobType } from '../job.enums';
import { JobHandler } from './job-handler.interface';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

@Injectable()
export class PrimeJobHandler implements JobHandler {
  readonly type = JobType.PRIME;

  private readonly workMs = process.env.WORKER_SLEEP_MS
    ? Number(process.env.WORKER_SLEEP_MS)
    : 5000;

  async handle(input: JobInput): Promise<JobResult> {
    const result = isPrime(input.value);
    // Mock work: simulate a slow task.
    await sleep(this.workMs);
    return { isPrime: result };
  }
}
