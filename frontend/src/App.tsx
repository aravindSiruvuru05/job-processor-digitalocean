import { useState } from 'react';
import {
  useCreateJobMutation,
  useGetJobsQuery,
  useRetryJobMutation,
} from './api/jobsApi';
import { Button, DlqSection, Input, JobColumn, Select } from './components';
import type { SelectOption } from './components';
import { groupByStatus } from './lib/group';
import { JobStatus, JobType } from './types';

const COLUMNS: { status: JobStatus; label: string; className: string }[] = [
  { status: JobStatus.QUEUED, label: 'Queued', className: 'queued' },
  { status: JobStatus.RUNNING, label: 'Running', className: 'running' },
  { status: JobStatus.COMPLETED, label: 'Completed', className: 'completed' },
];

const TYPE_OPTIONS: SelectOption<JobType>[] = Object.values(JobType).map(
  (type) => ({ value: type, label: type }),
);

export function App() {
  const { data: jobs = [] } = useGetJobsQuery(undefined, {
    pollingInterval: 2000,
  });
  const [createJob, { isLoading }] = useCreateJobMutation();
  const [retryJob, { isLoading: isRetrying, originalArgs: retryingId }] =
    useRetryJobMutation();
  const [type, setType] = useState<JobType>(JobType.SQUARE);
  const [value, setValue] = useState('9');

  const grouped = groupByStatus(jobs);

  const retry = (id: string) => {
    retryJob(id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    await createJob({ type, value: numeric });
  };

  return (
    <div className="app">
      <h1>Job Processor</h1>
      <p className="subtitle">
        Submit a number, the worker squares it after a 5s mock task.
      </p>

      <form className="enqueue" onSubmit={submit}>
        <Select value={type} options={TYPE_OPTIONS} onChange={setType} />
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="value"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enqueuing...' : 'Enqueue job'}
        </Button>
      </form>

      <div className="board board-3">
        {COLUMNS.map((col) => (
          <JobColumn
            key={col.status}
            label={col.label}
            className={col.className}
            jobs={grouped[col.status]}
          />
        ))}
      </div>

      <DlqSection
        jobs={grouped[JobStatus.FAILED]}
        onRetry={retry}
        retryingId={isRetrying ? retryingId : undefined}
      />
    </div>
  );
}
