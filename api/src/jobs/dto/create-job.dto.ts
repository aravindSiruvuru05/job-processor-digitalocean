import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { JobType } from '../job.enums';

export class CreateJobDto {
  @IsOptional()
  @IsEnum(JobType)
  type: JobType = JobType.SQUARE;

  @IsNumber()
  value: number;
}
