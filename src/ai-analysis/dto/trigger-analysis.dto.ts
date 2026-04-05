import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

export class TriggerAnalysisDto {
  @IsString()
  @IsNotEmpty()
  githubPullRequestId: string;
}

export class TriggerBatchAnalysisDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  githubPullRequestIds: string[];
}
