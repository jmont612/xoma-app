import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ConfirmVerificationCodeDto {
  @IsNotEmpty()
  @IsString()
  verificationCode: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
