import { JobInput, JobResult } from '../job.entity';
import { JobType } from '../job.enums';

// Strategy: each job type provides its own processing implementation
// behind this shared contract. Adding a new type means adding a new
// handler class that implements JobHandler.
export interface JobHandler {
  readonly type: JobType;
  handle(input: JobInput): Promise<JobResult>;
}
