import { IsString, IsOptional, IsDateString, IsInt, IsUUID, IsIn, IsNotEmpty } from 'class-validator';

export const VALID_STATUSES = ['backlog', 'en-progreso', 'completado'] as const;

export type TaskStatus = (typeof VALID_STATUSES)[number];

export class CreateTaskDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(VALID_STATUSES)
  status: TaskStatus;

  @IsString()
  @IsNotEmpty()
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

