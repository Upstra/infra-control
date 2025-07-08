import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ZohoMailAdapter } from '../adapters/zoho-mail.adapter';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

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
          dir: __dirname + '/templates',
          adapter: new HandlebarsAdapter(),
        },
      }),
    }),
  ],
  providers: [ZohoMailAdapter],
  exports: [ZohoMailAdapter],
})
export class EmailInfrastructureModule {}
