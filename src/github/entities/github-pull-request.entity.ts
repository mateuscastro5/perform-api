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
import { MonitoredRepository } from './monitored-repository.entity';
import { Developer } from '../../developers/entities/developer.entity';

@Entity('github_pull_requests')
@Index(['repositoryId', 'prNumber'], { unique: true })
@Index(['authorLogin'])
@Index(['state'])
@Index(['createdAt'])
export class GithubPullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
  @Column({ name: 'repository_id', type: 'uuid' })
  repositoryId: string;

  @ManyToOne(() => MonitoredRepository, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repository_id' })
  repository: MonitoredRepository;

  @Column({ name: 'developer_id', type: 'uuid', nullable: true })
  developerId: string | null;

  @ManyToOne(() => Developer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'developer_id' })
  developer: Developer | null;

  @Column({ name: 'pr_number', type: 'integer' })
  prNumber: number;

  @Column({ name: 'title', type: 'varchar' })
  title: string;

  @Column({ name: 'body', type: 'text', nullable: true })
  body: string | null;

  @Column({ name: 'state', type: 'varchar' })
  state: string; // open, closed, merged

  @Column({ name: 'author_login', type: 'varchar' })
  authorLogin: string;

  @Column({ name: 'author_email', type: 'varchar', nullable: true })
  authorEmail: string | null;

  @Column({ name: 'pr_created_at', type: 'timestamp' })
  prCreatedAt: Date;

  @Column({ name: 'pr_updated_at', type: 'timestamp' })
  prUpdatedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'merged_at', type: 'timestamp', nullable: true })
  mergedAt: Date | null;

  @Column({ name: 'additions', type: 'integer', default: 0 })
  additions: number;

  @Column({ name: 'deletions', type: 'integer', default: 0 })
  deletions: number;

  @Column({ name: 'changed_files', type: 'integer', default: 0 })
  changedFiles: number;

  @Column({ name: 'commits_count', type: 'integer', default: 0 })
  commitsCount: number;

  @Column({ name: 'comments_count', type: 'integer', default: 0 })
  commentsCount: number;

  @Column({ name: 'review_comments_count', type: 'integer', default: 0 })
  reviewCommentsCount: number;

  @Column({ name: 'html_url', type: 'varchar' })
  htmlUrl: string;

  @Column({ name: 'base_branch', type: 'varchar' })
  baseBranch: string;

  @Column({ name: 'head_branch', type: 'varchar' })
  headBranch: string;
}
