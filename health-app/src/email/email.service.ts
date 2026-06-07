import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailPayload } from '@/common/interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private getTransporter(): nodemailer.Transporter {
    const port = Number(process.env.EMAIL_PORT);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    return transporter;
  }

  async sendMail(payload: IEmailPayload) {
    try {
      payload.from = process.env.DEFAULT_MAIL_SENDER as string;

      await this.getTransporter().sendMail(payload);
    } catch (error) {
      this.logger.error('Failed to send email', {
        to: payload.to,
        subject: payload.subject,
        error: error.message,
        code: error.code,
      });
      throw new InternalServerErrorException(
        `Error sending confirmation email: ${error.message}`,
      );
    }
  }
}
