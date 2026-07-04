import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './job.entity';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async create(@Body() dto: CreateJobDto): Promise<Job> {
    return this.jobsService.create(dto);
  }

  @Post(':id/retry')
  retry(@Param('id') id: string): Promise<Job> {
    return this.jobsService.retry(id);
  }

  @Get()
  findAll(): Promise<Job[]> {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Job> {
    return this.jobsService.findOne(id);
  }
}
