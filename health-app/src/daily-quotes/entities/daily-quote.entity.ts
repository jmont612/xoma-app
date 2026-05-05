import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
} from 'typeorm';

@Entity('daily_quotes')
export class DailyQuote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  quote: string;

  @Column({ type: 'int' })
  day: number;

  @DeleteDateColumn()
  deletedAt: Date;
}
