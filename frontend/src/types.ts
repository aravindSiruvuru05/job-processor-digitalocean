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

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  input: { value: number };
  result: { square?: number; isPrime?: boolean } | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface CreateJobRequest {
  type: JobType;
  value: number;
}
