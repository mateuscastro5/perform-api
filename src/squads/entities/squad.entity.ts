import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Developer } from '../../developers/entities/developer.entity';

@Entity('squads')
export class Squad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'github_team', nullable: true })
  githubTeam: string;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => User, (user) => user.squad)
  members: User[];

  @ManyToOne(() => User, { nullable: true })
  techLead: User;

  @OneToMany(() => Developer, (developer) => developer.squad)
  developers: Developer[];
}
