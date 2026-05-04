import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsIn,
} from 'class-validator';

export class SubmitFeedbackDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  correctedScore: number;

  @IsString()
  @IsIn(['trivial', 'easy', 'medium', 'hard', 'expert'])
  correctedLabel: string;

  @IsString()
  @IsOptional()
  feedbackNote?: string;
}
