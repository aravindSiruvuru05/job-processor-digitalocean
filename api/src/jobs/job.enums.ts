export enum JobStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobType {
  SQUARE = 'square',
  PRIME = 'prime',
}

export const QUEUE_NAME = 'jobs';
