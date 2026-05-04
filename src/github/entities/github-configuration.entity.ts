import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MonitoredRepository } from './monitored-repository.entity';

@Entity('github_configurations')
export class GithubConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'github_token', type: 'text', select: false })
  githubToken: string;

  @Column({ name: 'github_username' })
  githubUsername: string;

  @Column({ name: 'github_user_id' })
  githubUserId: string;

  @Column({ name: 'data_range', type: 'integer', default: 1 })
  dataRange: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Wall-clock timestamp of the last successful data collection for this
   * configuration (manual or scheduled). Null when collection has never
   * completed. Used by the dashboard to render "synced X min ago".
   */
  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @OneToMany(() => MonitoredRepository, (repo) => repo.configuration, {
    cascade: true,
  })
  repositories: MonitoredRepository[];
}
