import { Module } from '@nestjs/common';
import { SshGateway } from './application/gateway/ssh.gateway';
import { OpenSshSessionUseCase } from './application/use-cases/open-ssh-session.use-case';
import { SshService } from './domain/services/ssh.service';

@Module({
  providers: [SshGateway, OpenSshSessionUseCase, SshService],
})
export class SshModule {}
