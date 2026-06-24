import { RmqService } from '@lib/rmq';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Email Service
 *
 * Responsible for:
 * - Sending emails using Nodemailer/MailerModule
 * - Logging email activity
 * - Acknowledging RabbitMQ messages
 */
@Injectable()
export class EmailService {
  /**
   * NestJS Logger
   * Used for application logs.
   */
  private logger = new Logger(EmailService.name);

  constructor(
    /**
     * MailerService provided by @nestjs-modules/mailer
     * Used to send actual emails.
     */
    private readonly mailService: MailerService,

    /**
     * RabbitMQ helper service
     * Used for message acknowledgement.
     */
    private readonly rmqService: RmqService,

    /**
     * ConfigService
     * Reads values from .env file.
     */
    private readonly configService: ConfigService,
  ) {}

  /**
   * Send Email
   *
   * Receives email payload from EmailController
   * and sends email through SMTP server.
   */
  async sendMail({ to, cc, subject, replyTo, html, attachments, context }) {
    try {
      /**
       * Log email sending attempt
       */
      this.logger.log(`Sending Email : ${to}`);

      /**
       * Get sender email address from .env
       */
      const from = this.configService.get('SMTP_MAIL');

      /**
       * Send email using MailerService
       */
      await this.mailService.sendMail({
        // Main recipient
        to: to,

        // CC recipients
        cc: cc,

        // Email subject
        subject: subject,

        // Reply-to address
        replyTo: replyTo ?? 'hr@pasdigitech.com',

        // Sender information
        from: `"PAS Digital Technologies" <${from}>`,

        // HTML email body
        html: html,

        // Email attachments
        attachments: attachments,
      });

      /**
       * Log successful email delivery
       */
      this.logger.log(`Email Sent Successfully To : ${to}`);

      /**
       * Acknowledge RabbitMQ message
       *
       * This tells RabbitMQ that the message
       * was processed successfully.
       */
      this.rmqService.ack(context);
    } catch (err) {
      /**
       * Log failure
       */
      this.logger.log(`Email Sending Failed To : ${to}`);

      /**
       * Email failed.
       * No ACK is sent.
       *
       * RabbitMQ may requeue the message
       * depending on queue configuration.
       */
      return;
    }
  }
}
