import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GithubConfiguration } from './github-configuration.entity';

@Entity('monitored_repositories')
export class MonitoredRepository {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'configuration_id', type: 'uuid' })
  configurationId: string;

  @ManyToOne(() => GithubConfiguration, (config) => config.repositories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'configuration_id' })
  configuration: GithubConfiguration;

  @Column({ name: 'repo_id', type: 'bigint' })
  repoId: string;

  @Column({ name: 'repo_name' })
  repoName: string;

  @Column({ name: 'repo_full_name' })
  repoFullName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'webhook_id', type: 'bigint', nullable: true })
  webhookId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
