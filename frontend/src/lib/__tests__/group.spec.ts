import { describe, expect, it } from 'vitest';
import { Job, JobStatus, JobType } from '../../types';
import { groupByStatus } from '../group';

const makeJob = (id: string, status: JobStatus): Job => ({
  id,
  type: JobType.SQUARE,
  status,
  input: { value: 2 },
  result: null,
  error: null,
  createdAt: '',
  updatedAt: '',
  startedAt: null,
  finishedAt: null,
});

describe('groupByStatus', () => {
  it('buckets jobs by their status', () => {
    const groups = groupByStatus([
      makeJob('a', JobStatus.QUEUED),
      makeJob('b', JobStatus.RUNNING),
      makeJob('c', JobStatus.COMPLETED),
      makeJob('d', JobStatus.COMPLETED),
    ]);

    expect(groups[JobStatus.QUEUED]).toHaveLength(1);
    expect(groups[JobStatus.RUNNING]).toHaveLength(1);
    expect(groups[JobStatus.COMPLETED]).toHaveLength(2);
    expect(groups[JobStatus.FAILED]).toHaveLength(0);
  });

  it('returns empty buckets for no jobs', () => {
    const groups = groupByStatus([]);
    expect(Object.values(groups).every((g) => g.length === 0)).toBe(true);
  });
});
