import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { QUEUE_NAME } from './job.enums';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    BullModule.registerQueue({ name: QUEUE_NAME }),
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
