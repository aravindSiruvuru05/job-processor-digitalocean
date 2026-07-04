import { Job, JobStatus } from '../types';

export function groupByStatus(jobs: Job[]): Record<JobStatus, Job[]> {
  const groups: Record<JobStatus, Job[]> = {
    [JobStatus.QUEUED]: [],
    [JobStatus.RUNNING]: [],
    [JobStatus.COMPLETED]: [],
    [JobStatus.FAILED]: [],
  };
  for (const job of jobs) {
    groups[job.status].push(job);
  }
  return groups;
}
