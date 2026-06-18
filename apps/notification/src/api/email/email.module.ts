import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailController } from './email.controller';
import { RmqService } from '@lib/rmq';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('SMTP_HOST'),
          secure: true,
          auth: {
            user: config.get('SMTP_MAIL'),
            pass: config.get('SMTP_PASSWORD'),
          },
        },
        defaults: {
          from: 'PAS Digital',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailService, RmqService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule {}
