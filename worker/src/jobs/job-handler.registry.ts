import { Inject, Injectable } from '@nestjs/common';
import { JobHandler } from './handlers/job-handler.interface';
import { JOB_HANDLERS, JobType } from './job.enums';

// Factory / Registry: resolves the correct handler (Strategy) for a
// given job type at runtime. Handlers are injected by DI, so the
// registry stays closed to modification when new types are added.
@Injectable()
export class JobHandlerRegistry {
  private readonly handlers = new Map<JobType, JobHandler>();

  constructor(@Inject(JOB_HANDLERS) handlers: JobHandler[]) {
    for (const handler of handlers) {
      this.handlers.set(handler.type, handler);
    }
  }

  resolve(type: JobType): JobHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`No handler registered for job type: ${type}`);
    }
    return handler;
  }
}
