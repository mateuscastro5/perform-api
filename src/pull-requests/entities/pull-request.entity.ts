import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Developer } from '../../developers/entities/developer.entity';
import { CodeReview } from '../../code-reviews/entities/code-review.entity';
import { Commit } from '../../commits/entities/commit.entity';

export enum PullRequestStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MERGED = 'merged',
}

@Entity('pull_requests')
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
  @Column({ name: 'github_id', unique: true })
  githubId: string;

  @Column({ name: 'pr_number' })
  prNumber: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PullRequestStatus,
    default: PullRequestStatus.OPEN,
  })
  status: PullRequestStatus;

  @Column({ name: 'repository_name' })
  repositoryName: string;

  @Column({ name: 'base_branch' })
  baseBranch: string;

  @Column({ name: 'head_branch' })
  headBranch: string;

  @Column({ name: 'lines_added', default: 0 })
  linesAdded: number;

  @Column({ name: 'lines_deleted', default: 0 })
  linesDeleted: number;

  @Column({ name: 'files_changed', default: 0 })
  filesChanged: number;

  @Column({ name: 'opened_at', type: 'timestamp' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column({ name: 'merged_at', type: 'timestamp', nullable: true })
  mergedAt: Date;

  @Column({ name: 'url', nullable: true })
  url: string;

  @ManyToOne(() => Developer, (developer) => developer.pullRequests)
  author: Developer;

  @OneToMany(() => CodeReview, (review) => review.pullRequest)
  reviews: CodeReview[];

  @OneToMany(() => Commit, (commit) => commit.pullRequest, { nullable: true })
  commits: Commit[];
}
