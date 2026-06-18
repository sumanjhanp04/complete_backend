import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        SOCKET_PORT: Joi.number().required(),
        NODE_ENV: Joi.valid('dev', 'prod', 'test').required(),
        IP: Joi.string().required(),
        ALLOWED_ORIGIN: Joi.alternatives()
          .try(Joi.string(), Joi.array().items(Joi.string()))
          .required(),

        MONGODB_URI: Joi.string().required(),
        RABBIT_MQ_URI: Joi.string().required(),
        RABBIT_MQ_AUTH_QUEUE: Joi.string().required(),
        RABBIT_MQ_NOTIFICATION_QUEUE: Joi.string().required(),

        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),

        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.string().required(),
        SMTP_SERVICE: Joi.string().required(),
        SMTP_MAIL: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),

        AWS_S3_ACCESS_KEY_ID: Joi.string().required(),
        AWS_S3_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),
        AWS_S3_REGION: Joi.string().required(),

        REDIS_URL: Joi.string().required(),

        // AES Encryption
        AES_KEY: Joi.string().required().min(64).max(64), // 32-byte key in hex (64 characters)
      }),
      envFilePath: ['dev.env', 'prod.env'],
    }),
  ],

  providers: [],
  exports: [NestConfigModule],
})
export class ConfigModule { }
