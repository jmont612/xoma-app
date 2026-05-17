import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('auth')
export class Auth {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text' })
  refreshToken: string;

  @Column({ type: 'varchar', length: 6, nullable: true })
  verificationCode: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verificationCodeExpiry: Date | null;
}
