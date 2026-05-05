import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Reflection } from '../../reflections/entities/reflection.entity';
import { DiaryBehavior } from '../../diary-behaviors/entities/diary-behavior.entity';
import { DiaryMoodState } from '../../diary-mood-states/entities/diary-mood-state.entity';

@Entity('diaries')
export class Diary {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.diaries)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  entryDate: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => Reflection, (reflection) => reflection.diary)
  reflections: Reflection;

  @OneToMany(() => DiaryBehavior, (db) => db.diary)
  behaviors: DiaryBehavior[];

  @OneToMany(() => DiaryMoodState, (dms) => dms.diary)
  moodStates: DiaryMoodState[];
}
