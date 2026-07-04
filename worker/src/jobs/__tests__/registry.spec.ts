import { JobHandler } from '../handlers/job-handler.interface';
import { JobType } from '../job.enums';
import { JobHandlerRegistry } from '../job-handler.registry';

const makeHandler = (type: JobType): JobHandler => ({
  type,
  handle: jest.fn(async () => ({ square: 1 })),
});

describe('JobHandlerRegistry', () => {
  it('resolves a registered handler by type', () => {
    const square = makeHandler(JobType.SQUARE);
    const registry = new JobHandlerRegistry([square]);
    expect(registry.resolve(JobType.SQUARE)).toBe(square);
  });

  it('throws for an unregistered job type', () => {
    const registry = new JobHandlerRegistry([]);
    expect(() => registry.resolve(JobType.SQUARE)).toThrow(
      /No handler registered/,
    );
  });
});
