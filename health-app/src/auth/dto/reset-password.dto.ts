import { IsJWT, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsJWT()
  token: string;

  @IsString()
  newPassword: string;
}
