import { Module } from '@nestjs/common';
import { EmailInfrastructureModule } from './infrastructures/email-infrastructure.module';
import { EmailApplicationModule } from './application/email-application.module';
import { EmailEventListener } from './infrastructure/listeners/email-event.listener';

@Module({
  imports: [EmailInfrastructureModule, EmailApplicationModule],
  providers: [EmailEventListener],
  exports: [EmailApplicationModule],
})
export class EmailModule {}