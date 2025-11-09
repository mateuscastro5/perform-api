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

@Entity('commits')
export class Commit {
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

  @Column({ name: 'sha', unique: true })
  sha: string;

  @Column()
  message: string;

  @Column({ name: 'repository_name' })
  repositoryName: string;

  @Column({ name: 'branch_name' })
  branchName: string;

  @Column({ name: 'lines_added', default: 0 })
  linesAdded: number;

  @Column({ name: 'lines_deleted', default: 0 })
  linesDeleted: number;

  @Column({ name: 'files_changed', default: 0 })
  filesChanged: number;

  @Column({ name: 'committed_at', type: 'timestamp' })
  committedAt: Date;

  @Column({ name: 'url', nullable: true })
  url: string;

  @ManyToOne(() => Developer, (developer) => developer.commits)
  author: Developer;

  @ManyToOne(() => PullRequest, (pr) => pr.commits, { nullable: true })
  pullRequest: PullRequest;
}
