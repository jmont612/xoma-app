import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ContactType } from '../../common/enums/contact-type.enum';

@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.emergencyContacts)
  user: User;

  @Column({ type: 'text' })
  firstName: string;

  @Column({ type: 'text' })
  lastName: string;

  @Column({ type: 'text' })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: ContactType,
  })
  contactType: ContactType;

  @DeleteDateColumn()
  deletedAt: Date;
}
