import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { GithubPullRequest } from './github-pull-request.entity';
import { Developer } from '../../developers/entities/developer.entity';

@Entity('github_pr_reviews')
@Index(['pullRequestId', 'reviewId'], { unique: true })
@Index(['reviewerLogin'])
@Index(['submittedAt'])
export class GithubPRReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
  @Column({ name: 'pull_request_id', type: 'uuid' })
  pullRequestId: string;

  @ManyToOne(() => GithubPullRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pull_request_id' })
  pullRequest: GithubPullRequest;

  @Column({ name: 'developer_id', type: 'uuid', nullable: true })
  developerId: string | null;

  @ManyToOne(() => Developer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'developer_id' })
  developer: Developer | null;

  @Column({ name: 'review_id', type: 'bigint' })
  reviewId: string;

  @Column({ name: 'reviewer_login', type: 'varchar' })
  reviewerLogin: string;

  @Column({ name: 'reviewer_email', type: 'varchar', nullable: true })
  reviewerEmail: string | null;

  @Column({ name: 'state', type: 'varchar' })
  state: string; // APPROVED, CHANGES_REQUESTED, COMMENTED, DISMISSED

  @Column({ name: 'body', type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'submitted_at', type: 'timestamp' })
  submittedAt: Date;

  @Column({ name: 'html_url', type: 'varchar' })
  htmlUrl: string;
}
