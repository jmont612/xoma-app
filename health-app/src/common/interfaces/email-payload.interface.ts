export interface IEmailPayload {
  from?: string;
  to: string;
  subject: string;
  html: string;
}
