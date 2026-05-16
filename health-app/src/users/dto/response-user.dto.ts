import { Expose } from 'class-transformer';
import { Gender } from '@/common/enums/gender.enum';

export class ResponseUserDto {
  @Expose()
  id: number;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  age: number;

  @Expose()
  gender: Gender;

  @Expose()
  consentAccepted: boolean;
}
