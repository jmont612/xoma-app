import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRegisterHelper {
  generateVerificationCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000);
    return code.toString();
  }
}
