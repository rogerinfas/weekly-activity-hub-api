import { IsString, IsOptional, IsDateString, IsInt, IsUUID, IsIn } from 'class-validator';

export const VALID_STATUSES = ['backlog', 'en-progreso', 'completado'] as const;
export const VALID_PROJECTS = ['desarrollo', 'diseño', 'marketing', 'personal', 'otro'] as const;

export type TaskStatus = (typeof VALID_STATUSES)[number];
export type TaskProject = (typeof VALID_PROJECTS)[number];

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

  @IsIn(VALID_PROJECTS)
  project: TaskProject;

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

