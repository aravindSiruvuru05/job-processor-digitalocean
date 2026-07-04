import { NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job } from '../job.entity';
import { JobStatus, JobType } from '../job.enums';
import { JobsService } from '../jobs.service';

describe('JobsService', () => {
  let service: JobsService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let queue: { add: jest.Mock };

  beforeEach(() => {
    repo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => ({ id: 'job-1', ...data })),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    queue = { add: jest.fn(async () => ({})) };

    service = new JobsService(repo as unknown as Repository<Job>, queue as unknown as Queue);
  });

  it('persists a QUEUED record and enqueues the job', async () => {
    const dto: CreateJobDto = { type: JobType.SQUARE, value: 9 };

    const job = await service.create(dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        type: JobType.SQUARE,
        status: JobStatus.QUEUED,
        input: { value: 9 },
      }),
    );
    expect(queue.add).toHaveBeenCalledWith(
      JobType.SQUARE,
      { jobId: 'job-1', type: JobType.SQUARE, value: 9 },
      { jobId: 'job-1' },
    );
    expect(job.id).toBe('job-1');
    expect(job.status).toBe(JobStatus.QUEUED);
  });

  it('returns immediately without waiting on processing', async () => {
    await service.create({ type: JobType.SQUARE, value: 4 });
    // The service never awaits any processing; enqueue is fire-and-return.
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException for an unknown id', async () => {
    repo.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
