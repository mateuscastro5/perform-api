import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Squad } from '../../squads/entities/squad.entity';
import { PullRequest } from '../../pull-requests/entities/pull-request.entity';
import { Commit } from '../../commits/entities/commit.entity';
import { CodeReview } from '../../code-reviews/entities/code-review.entity';
import { Metric } from '../../metrics/entities/metric.entity';

@Entity('developers')
export class Developer {
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

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ name: 'github_username', unique: true })
  githubUsername: string;

  @Column({ name: 'avatar_url', nullable: true, type: 'varchar' })
  avatarUrl: string | null;

  @Column({ name: 'profile_url', nullable: true, type: 'varchar' })
  profileUrl: string | null;

  @Column({ default: true })
  active: boolean;

  @Column({ name: 'squad_id', type: 'uuid', nullable: true })
  squadId: string | null;

  @ManyToOne(() => Squad, (squad) => squad.developers, { nullable: true })
  @JoinColumn({ name: 'squad_id' })
  squad: Squad;

  @OneToMany(() => PullRequest, (pr) => pr.author)
  pullRequests: PullRequest[];

  @OneToMany(() => Commit, (commit) => commit.author)
  commits: Commit[];

  @OneToMany(() => CodeReview, (review) => review.reviewer)
  reviews: CodeReview[];

  @OneToMany(() => Metric, (metric) => metric.developer)
  metrics: Metric[];
}
