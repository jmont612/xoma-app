import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { SubSkill } from '../../sub-skills/entities/sub-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  name: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => SubSkill, (subSkill) => subSkill.skill)
  subSkills: SubSkill[];
}
