import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmaType } from '../../ema-types/entities/ema-type.entity';

@Entity('ema_logs')
export class EmaLog {
  @PrimaryGeneratedColumn('identity')
  id: number;

  @ManyToOne(() => User, (user) => user.emaLogs)
  @JoinColumn()
  user: User;

  @ManyToOne(() => EmaType, (emaType) => emaType.emaLogs)
  @JoinColumn()
  emaType: EmaType;

  @Column({ type: 'int', nullable: true })
  rating: number;

  @Column({ type: 'boolean', nullable: true })
  booleanValue: boolean;

  @Column({ type: 'varchar', length: 10, nullable: true })
  riskLevel: string | null;

  @CreateDateColumn()
  logDate: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
