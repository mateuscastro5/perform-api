export class AnalysisResultDto {
  analysisId: string;
  score: number;
  confidence: number;
  difficultyLabel: string;
  justification: string;
  technicalSummary: string;
  technologies: string[];
  changeType: string;
  similarExamples: {
    score: number;
    label: string;
    summary: string;
    similarity: number;
  }[];
  requiresReview: boolean;
  processingTimeMs: number;
}
