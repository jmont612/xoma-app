import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';

export interface IRequest extends Request {
  user: User;
  accessToken?: string;
}
