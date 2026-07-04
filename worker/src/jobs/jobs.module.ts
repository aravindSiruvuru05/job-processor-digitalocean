import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrimeJobHandler } from './handlers/prime.handler';
import { SquareJobHandler } from './handlers/square.handler';
import { Job } from './job.entity';
import { JOB_HANDLERS, QUEUE_NAME } from './job.enums';
import { JobHandlerRegistry } from './job-handler.registry';
import { JobProcessor } from './job.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({ name: QUEUE_NAME }),
  ],
  providers: [
    SquareJobHandler,
    PrimeJobHandler,
    {
      // Collect every registered handler into the list the registry consumes.
      provide: JOB_HANDLERS,
      useFactory: (...handlers) => handlers,
      inject: [SquareJobHandler, PrimeJobHandler],
    },
    JobHandlerRegistry,
    JobProcessor,
  ],
})
export class JobsModule {}
