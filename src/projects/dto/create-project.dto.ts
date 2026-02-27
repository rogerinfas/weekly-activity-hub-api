import { IsString, IsOptional, IsInt, Matches } from 'class-validator';

export const VALID_COLORS = [
  'blue', 'violet', 'pink', 'amber', 'slate',
  'emerald', 'red', 'orange', 'cyan', 'rose',
] as const;

export type ProjectColor = (typeof VALID_COLORS)[number];

export class CreateProjectDto {
  @IsString()
  @Matches(/^[a-záéíóúñü][a-záéíóúñü0-9-]*$/, {
    message: 'name must be a lowercase slug (letters, numbers, hyphens)',
  })
  name: string;

  @IsString()
  label: string;

  @IsString()
  color: string;

  @IsInt()
  @IsOptional()
  order?: number;
}
