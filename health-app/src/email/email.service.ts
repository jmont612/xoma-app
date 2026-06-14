import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';
import { IEmailPayload } from '@/common/interfaces/email-payload.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendMail(payload: IEmailPayload) {
    try {
      const from =
        payload.from ??
        process.env.DEFAULT_MAIL_SENDER ??
        'onboarding@resend.dev';

      const { error } = await this.resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });

      if (error) {
        this.logger.error('Resend API error', error);
        throw new Error(error.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to send email', {
        to: payload.to,
        subject: payload.subject,
        error: message,
      });

      throw new InternalServerErrorException(
        `Error sending confirmation email: ${message}`,
      );
    }
  }
}
