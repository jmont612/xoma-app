import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailPayload } from 'src/common/interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private getTransporter(): nodemailer.Transporter {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    return transporter;
  }

  async sendMail(payload: IEmailPayload) {
    try {
      payload.from = process.env.DEFAULT_MAIL_SENDER as string;

      await this.getTransporter().sendMail(payload);
    } catch (error) {
      throw new InternalServerErrorException(
        `Error sending confirmation email: ${error.message}`,
      );
    }
  }
}
