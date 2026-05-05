import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { EmaLog } from '../../ema-logs/entities/ema-log.entity';
import { EmaTypeEvaluationType } from '../../common/enums/ema-type-evaluation-type.enum';

@Entity('ema_types')
export class EmaType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: EmaTypeEvaluationType,
  })
  evaluationType: EmaTypeEvaluationType;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => EmaLog, (log) => log.emaType)
  emaLogs: EmaLog[];
}
