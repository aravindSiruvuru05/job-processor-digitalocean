import { JobType } from '../../job.enums';
import { SquareJobHandler } from '../square.handler';

describe('SquareJobHandler', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes the square job type', () => {
    expect(new SquareJobHandler().type).toBe(JobType.SQUARE);
  });

  it('computes the square of the input value', async () => {
    const handler = new SquareJobHandler();
    const promise = handler.handle({ value: 9 });
    // Fast-forward the simulated work delay.
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ square: 81 });
  });

  it('handles negative values', async () => {
    const handler = new SquareJobHandler();
    const promise = handler.handle({ value: -4 });
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ square: 16 });
  });
});
