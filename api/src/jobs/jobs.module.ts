import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { QUEUE_NAME } from './job.enums';
import { JobReconciliationService } from './job-reconciliation.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({
      name: QUEUE_NAME,
      defaultJobOptions: {
        // Automatic retry with exponential backoff for transient failures;
        // only genuinely poisoned jobs exhaust attempts and land in the DLQ.
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        // Bounded retention so Redis does not grow without limit.
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 86400, count: 5000 },
      },
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobReconciliationService],
})
export class JobsModule {}
