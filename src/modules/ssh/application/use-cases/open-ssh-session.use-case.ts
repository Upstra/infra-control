import { Injectable } from '@nestjs/common';
import { SshService, SshSession } from '../../domain/services/ssh.service';

@Injectable()
export class OpenSshSessionUseCase {
  constructor(private readonly sshService: SshService) {}

  execute(options: {
    host: string;
    username: string;
    password: string;
  }): Promise<SshSession> {
    return this.sshService.createSession(options);
  }
}
