import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Developer } from '../../developers/entities/developer.entity';
import { PullRequest } from '../../pull-requests/entities/pull-request.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  CHANGES_REQUESTED = 'changes_requested',
  COMMENTED = 'commented',
}

@Entity('code_reviews')
export class CodeReview {
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

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @ManyToOne(() => Developer, (developer) => developer.reviews)
  reviewer: Developer;

  @ManyToOne(() => PullRequest, (pr) => pr.reviews)
  pullRequest: PullRequest;
}
