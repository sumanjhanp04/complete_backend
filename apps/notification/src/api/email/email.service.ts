import { RmqService } from '@lib/rmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);
  constructor(
    private readonly mailService: MailerService,
    private readonly rmqService: RmqService,
    private readonly configService: ConfigService,
  ) { }

  async sendMail({ to, cc, subject, replyTo, html, attachments, context }) {
    try {
      this.logger.log(`Sending Email : ${to}`);
      const from = this.configService.get('SMTP_MAIL');
      await this.mailService.sendMail({
        to: to,
        cc: cc,
        subject: subject,
        replyTo: replyTo ?? 'hr@pasdigitech.com',
        from: `"PAS Digital Technologies" <${from}>`,
        html: html,
        attachments: attachments,
      });
      this.logger.log(`Email Sent Successfully To : ${to}`);
      this.rmqService.ack(context);
    } catch (err) {
      this.logger.log(`Email Sending Failed To : ${to}`);
      return;
    }
  }
}
