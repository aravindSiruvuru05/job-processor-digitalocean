import type { Job } from '../types';
import { JobCard } from './JobCard';

interface JobColumnProps {
  label: string;
  className: string;
  jobs: Job[];
}

export function JobColumn({ label, className, jobs }: JobColumnProps) {
  return (
    <div className={`column ${className}`}>
      <h2>
        <span>{label}</span>
        <span className="count">{jobs.length}</span>
      </h2>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
