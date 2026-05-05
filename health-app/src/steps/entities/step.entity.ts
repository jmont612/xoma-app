import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { SubSkill } from '../../sub-skills/entities/sub-skill.entity';

@Entity('steps')
export class Step {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @ManyToOne(() => SubSkill, (subSkill) => subSkill.steps)
  @JoinColumn()
  subSkill: SubSkill;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'boolean' })
  hasTimer: boolean;

  @Column({ type: 'boolean' })
  requiresValidation: boolean;

  @DeleteDateColumn()
  deletedAt: Date;
}
