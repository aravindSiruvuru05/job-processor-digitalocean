import { Job as BullJob } from 'bullmq';
import { Repository } from 'typeorm';
import { Job } from '../job.entity';
import { JobType } from '../job.enums';
import { JobHandlerRegistry } from '../job-handler.registry';
import { JobPayload, JobProcessor } from '../job.processor';

const bullJob = (data: JobPayload) => ({ data }) as BullJob<JobPayload>;

describe('JobProcessor (idempotent, guarded transitions)', () => {
  let repo: { update: jest.Mock };
  let registry: { resolve: jest.Mock };
  let processor: JobProcessor;
  const handler = {
    type: JobType.SQUARE,
    handle: jest.fn(async () => ({ square: 81 })),
  };

  beforeEach(() => {
    repo = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
    registry = { resolve: jest.fn(() => handler) };
    processor = new JobProcessor(
      repo as unknown as Repository<Job>,
      registry as unknown as JobHandlerRegistry,
    );
    handler.handle.mockClear();
  });

  it('claims a queued job, runs the handler, and marks it completed', async () => {
    const result = await processor.process(
      bullJob({ jobId: 'j1', type: JobType.SQUARE, value: 9 }),
    );

    expect(handler.handle).toHaveBeenCalledWith({ value: 9 });
    expect(result).toEqual({ square: 81 });
    // claim (-> RUNNING) then completion (-> COMPLETED)
    expect(repo.update).toHaveBeenCalledTimes(2);
  });

  it('skips a duplicate/stalled delivery it cannot claim (no clobber, no reprocess)', async () => {
    repo.update.mockResolvedValueOnce({ affected: 0 });

    const result = await processor.process(
      bullJob({ jobId: 'j1', type: JobType.SQUARE, value: 9 }),
    );

    expect(result).toBeUndefined();
    expect(registry.resolve).not.toHaveBeenCalled();
    expect(handler.handle).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledTimes(1); // only the failed claim
  });

  it('marks the job failed and rethrows so BullMQ can retry', async () => {
    registry.resolve.mockReturnValueOnce({
      type: JobType.SQUARE,
      handle: jest.fn(async () => {
        throw new Error('boom');
      }),
    });

    await expect(
      processor.process(bullJob({ jobId: 'j1', type: JobType.SQUARE, value: 9 })),
    ).rejects.toThrow('boom');

    // claim (-> RUNNING) then failure (-> FAILED)
    expect(repo.update).toHaveBeenCalledTimes(2);
  });
});
