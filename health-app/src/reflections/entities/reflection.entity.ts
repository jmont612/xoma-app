import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { Diary } from '../../diaries/entities/diary.entity';

@Entity('reflections')
export class Reflection {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @OneToOne(() => Diary)
  @JoinColumn({ name: 'diary_id' })
  diary: Diary;

  @Column({ type: 'text' })
  mostDifficultToday: string;

  @Column({ type: 'text' })
  mostHelpfulToday: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
