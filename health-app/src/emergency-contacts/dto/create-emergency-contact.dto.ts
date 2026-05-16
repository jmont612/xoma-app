import { IsString, IsEnum, IsInt, Length } from 'class-validator';
import { ContactType } from '@/common/enums/contact-type.enum';

export class CreateEmergencyContactDto {
  @IsInt()
  userId: number;

  @IsString()
  @Length(2, 100)
  firstName: string;

  @IsString()
  @Length(2, 100)
  lastName: string;

  @IsString()
  @Length(9, 20)
  phoneNumber: string;

  @IsEnum(ContactType)
  contactType: ContactType;
}
