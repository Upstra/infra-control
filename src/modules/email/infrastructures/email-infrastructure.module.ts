import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ZohoMailAdapter } from '../adapters/zoho-mail.adapter';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
        defaults: {
          from: process.env.MAIL_FROM,
        },
        template: {
          dir: join(
            process.cwd(),
            'dist/modules/email/infrastructures/templates',
          ),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [ZohoMailAdapter],
  exports: [ZohoMailAdapter],
})
export class EmailInfrastructureModule {}
