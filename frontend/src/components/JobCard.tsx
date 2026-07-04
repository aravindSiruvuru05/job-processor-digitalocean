import type { Job } from '../types';
import { Button } from './Button';
import { Card } from './Card';

interface JobCardProps {
  job: Job;
  needsAttention?: boolean;
  onRetry?: (id: string) => void;
  retrying?: boolean;
}

export function JobCard({ job, needsAttention, onRetry, retrying }: JobCardProps) {
  return (
    <Card>
      <div className="id">{job.id.slice(0, 8)}</div>
      <div>
        <span className="value">
          {job.type}({job.input.value})
        </span>
      </div>
      {job.result?.square !== undefined && (
        <div className="result">= {job.result.square}</div>
      )}
      {job.result?.isPrime !== undefined && (
        <div className="result">{job.result.isPrime ? 'prime' : 'not prime'}</div>
      )}
      {job.error && <div className="error">{job.error}</div>}
      {needsAttention && <div className="attention">needs human attention</div>}
      {onRetry && (
        <Button
          className="retry"
          onClick={() => onRetry(job.id)}
          disabled={retrying}
        >
          {retrying ? 'Retrying...' : 'Retry'}
        </Button>
      )}
    </Card>
  );
}
