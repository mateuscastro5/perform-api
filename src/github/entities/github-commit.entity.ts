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

@Entity('github_commits')
@Index(['repositoryId', 'commitSha'], { unique: true })
@Index(['authorEmail'])
@Index(['committedDate'])
export class GithubCommit {
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

  @Column({ name: 'commit_sha', type: 'varchar', length: 40 })
  commitSha: string;

  @Column({ name: 'message', type: 'text' })
  message: string;

  @Column({ name: 'author_name', type: 'varchar' })
  authorName: string;

  @Column({ name: 'author_email', type: 'varchar' })
  authorEmail: string;

  @Column({ name: 'committed_date', type: 'timestamp' })
  committedDate: Date;

  @Column({ name: 'additions', type: 'integer', default: 0 })
  additions: number;

  @Column({ name: 'deletions', type: 'integer', default: 0 })
  deletions: number;

  @Column({ name: 'changed_files', type: 'integer', default: 0 })
  changedFiles: number;

  @Column({ name: 'branch', type: 'varchar', nullable: true })
  branch: string | null;

  @Column({ name: 'html_url', type: 'varchar' })
  htmlUrl: string;
}
