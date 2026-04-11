import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GithubPullRequest } from '../../github/entities/github-pull-request.entity';
import { Developer } from '../../developers/entities/developer.entity';
import { User } from '../../users/entities/user.entity';

@Entity('pr_analyses')
export class PrAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'github_pull_request_id' })
  githubPullRequestId: string;

  @ManyToOne(() => GithubPullRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'github_pull_request_id' })
  githubPullRequest: GithubPullRequest;

  @Column({ name: 'developer_id', type: 'uuid', nullable: true })
  developerId: string | null;

  @ManyToOne(() => Developer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'developer_id' })
  developer: Developer | null;

  // AI Results
  @Column({ name: 'complexity_score', type: 'float' })
  complexityScore: number;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ name: 'difficulty_label' })
  difficultyLabel: string;

  @Column({ type: 'text' })
  justification: string;

  @Column({ name: 'technical_summary', type: 'text' })
  technicalSummary: string;

  @Column({ type: 'text', default: '[]' })
  technologies: string;

  @Column({ name: 'change_type', default: 'feature' })
  changeType: string;

  // Status & Feedback
  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'corrected_score', type: 'float', nullable: true })
  correctedScore: number | null;

  @Column({ name: 'corrected_label', type: 'varchar', nullable: true })
  correctedLabel: string | null;

  @Column({ name: 'corrected_by', type: 'uuid', nullable: true })
  correctedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'corrected_by' })
  correctedByUser: User | null;

  @Column({ name: 'corrected_at', type: 'timestamp', nullable: true })
  correctedAt: Date | null;

  @Column({ name: 'feedback_note', type: 'text', nullable: true })
  feedbackNote: string | null;

  // Metadata
  @Column({ name: 'processing_time_ms', default: 0 })
  processingTimeMs: number;

  @Column({ name: 'llm_reader_model', default: '' })
  llmReaderModel: string;

  @Column({ name: 'llm_scorer_model', default: '' })
  llmScorerModel: string;

  @Column({ name: 'similar_examples_used', type: 'text', default: '[]' })
  similarExamplesUsed: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
