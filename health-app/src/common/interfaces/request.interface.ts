import { Request } from 'express';
import { User } from '@/users/entities/user.entity';

export interface IRequest extends Request {
  user: User;
  accessToken?: string;
}
