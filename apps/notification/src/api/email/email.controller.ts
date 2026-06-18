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

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly rmqService: RmqService,
  ) {}

  @MessagePattern({ cmd: NOTIFY_USERS_TOPIC.SEND_EMAIL })
  async sendEmail(
    @Payload()
    payload: {
      to: any;
      cc: any;
      subject: any;
      replyTo: any;
      html: any;
      attachments: any;
    },
    @Ctx() context: RmqContext,
  ) {
    // this.rmqService.ack(context);
    return await this.emailService.sendMail({ ...payload, context });
  }
  // @Get(":name/:email")
  // async sendEmail(@Param() params: any) {
  // const { name, email } = params;
  // console.log(params)
  // const password = generateRandomString(10);
  // const templateUrl = join(this.configService.get("TEMPLATE_LOCATION"), "employee_onboarding.html");
  // const template = readFileSync(templateUrl).toString()
  //   .replaceAll("{{name}}", name)
  //   .replaceAll("{{email}}", email)
  //   .replaceAll("{{password}}", password)
  // return template;
  // return await this.emailService.sendMail({ ...params, subject: `Welcome ${name} to the Portal`, template: template })
  // return template;
  // }
}
