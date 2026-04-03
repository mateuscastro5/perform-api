import { IsOptional, IsString } from 'class-validator';

export class CreateDeveloperDto {
  @IsOptional()
  @IsString()
  squadId?: string | null;
}
