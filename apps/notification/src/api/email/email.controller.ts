import { Controller, Get, Param } from '@nestjs/common';
import { EmailService } from './email.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { join } from 'path';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@lib/rmq';
import { NOTIFY_USERS_TOPIC } from '@lib/common';

/**
 * Email Controller
 *
 * Handles email-related operations.
 * Primarily works as a RabbitMQ consumer that listens
 * for email events and forwards them to EmailService.
 */
@Controller('email')
export class EmailController {
  constructor(
    // Service responsible for sending emails
    private readonly emailService: EmailService,

    // Used to access environment variables and app configuration
    private readonly configService: ConfigService,

    // RabbitMQ utility service
    private readonly rmqService: RmqService,
  ) {}

  /**
   * RabbitMQ Consumer
   *
   * Listens for messages with command:
   * NOTIFY_USERS_TOPIC.SEND_EMAIL
   *
   * Whenever another microservice publishes an email event,
   * this method receives the payload and sends the email.
   */
  @MessagePattern({ cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL })
  async sendEmail(
    @Payload()
    payload: {
      to: any; // Recipient email address(es)
      cc: any; // CC recipients
      subject: any; // Email subject
      replyTo: any; // Reply-to address
      html: any; // HTML email content
      attachments: any; // Email attachments
    },

    // RabbitMQ message context
    @Ctx() context: RmqContext,
  ) {
    /**
     * Acknowledge the RabbitMQ message.
     * Currently commented out.
     *
     * If enabled:
     * this.rmqService.ack(context);
     */
    // this.rmqService.ack(context);

    /**
     * Forward the payload to EmailService
     * which actually sends the email.
     */
    return await this.emailService.sendMail({
      ...payload,
      context,
    });
  }

  /**
   * --------------------------------------------------------------------------
   * TEST EMAIL API (Currently Commented)
   * --------------------------------------------------------------------------
   *
   * Endpoint:
   * GET /email/:name/:email
   *
   * Purpose:
   * - Generate onboarding email template
   * - Create temporary password
   * - Load HTML template file
   * - Replace placeholders
   * - Send welcome email
   *
   * Example:
   * GET /email/Suman/test@gmail.com
   *
   * Flow:
   * Request
   *    ↓
   * Generate Password
   *    ↓
   * Read HTML Template
   *    ↓
   * Replace Variables
   *    ↓
   * Send Email
   */

  // @Get(":name/:email")
  // async sendEmail(@Param() params: any) {

  //   // Extract route parameters
  //   const { name, email } = params;

  //   console.log(params);

  //   // Generate random password
  //   const password = generateRandomString(10);

  //   // Build template file path
  //   const templateUrl = join(
  //     this.configService.get("TEMPLATE_LOCATION"),
  //     "employee_onboarding.html"
  //   );

  //   // Read HTML template
  //   const template = readFileSync(templateUrl)
  //     .toString()
  //     .replaceAll("{{name}}", name)
  //     .replaceAll("{{email}}", email)
  //     .replaceAll("{{password}}", password);

  //   // Return template for testing
  //   return template;

  //   // Send onboarding email
  //   return await this.emailService.sendMail({
  //     ...params,
  //     subject: `Welcome ${name} to the Portal`,
  //     template: template
  //   });
  // }
}
