import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailController } from './email.controller';
import { RmqService } from '@lib/rmq';

/**
 * Email Module
 *
 * Responsible for:
 * - Email configuration
 * - SMTP connection setup
 * - Email sending functionality
 * - RabbitMQ email consumer registration
 */
@Module({
  imports: [
    /**
     * Configure MailerModule dynamically
     * using environment variables.
     */
    MailerModule.forRootAsync({
      /**
       * Factory function runs during application startup.
       * Reads SMTP configuration from .env file.
       */
      useFactory: async (config: ConfigService) => ({
        transport: {
          /**
           * SMTP Server Host
           * Example:
           * smtp.gmail.com
           * smtp.office365.com
           */
          host: config.get('SMTP_HOST'),

          /**
           * Use SSL/TLS connection
           */
          secure: true,

          /**
           * SMTP Authentication Credentials
           */
          auth: {
            user: config.get('SMTP_MAIL'), // Sender Email
            pass: config.get('SMTP_PASSWORD'), // Sender Password/App Password
          },
        },

        /**
         * Default sender information
         * Used when "from" is not specified.
         */
        defaults: {
          from: 'PAS Digital',
        },
      }),

      /**
       * Inject ConfigService into useFactory
       */
      inject: [ConfigService],
    }),
  ],

  /**
   * Services available inside this module
   */
  providers: [
    EmailService, // Contains email sending logic
    RmqService, // RabbitMQ helper service
  ],

  /**
   * Controllers handling incoming requests/events
   */
  controllers: [EmailController],

  /**
   * Export EmailService so other modules
   * can use it.
   */
  exports: [EmailService],
})
export class EmailModule {}
