import { IsString, IsOptional, IsDateString, IsInt, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  status: string;

  @IsString()
  project: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsDateString()
  @IsOptional()
  createdAt?: string;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}

