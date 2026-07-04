import type { Job } from '../types';
import { JobCard } from './JobCard';

interface DlqSectionProps {
  jobs: Job[];
  onRetry: (id: string) => void;
  retryingId?: string;
}

export function DlqSection({ jobs, onRetry, retryingId }: DlqSectionProps) {
  return (
    <section className="dlq">
      <h2>
        <span>Dead Letter Queue</span>
        <span className="count">{jobs.length}</span>
      </h2>
      <p className="dlq-hint">
        Jobs that failed and need human attention. Retry once the issue is
        resolved.
      </p>
      {jobs.length === 0 ? (
        <p className="dlq-empty">Nothing here — all clear.</p>
      ) : (
        <div className="dlq-list">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              needsAttention
              onRetry={onRetry}
              retrying={retryingId === job.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
