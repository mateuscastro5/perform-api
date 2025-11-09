import { IsArray, IsNumber, Min, Max, ArrayMinSize } from 'class-validator';

export class ConfigureGithubDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Select at least one repository' })
  repositories: number[];

  @IsNumber()
  @Min(1, { message: 'Minimum period is 1 month' })
  @Max(12, { message: 'Maximum period is 12 months' })
  dataRange: number;
}
