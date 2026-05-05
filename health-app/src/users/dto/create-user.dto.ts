import {
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsBoolean,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Gender } from 'src/common/enums/gender.enum';

export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsString()
  @Length(3, 30)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 100)
  password: string;

  @IsInt()
  @Min(13)
  @Max(120)
  age: number;

  @IsEnum(Gender)
  gender: Gender;

  @IsBoolean()
  consentAccepted: boolean;
}
