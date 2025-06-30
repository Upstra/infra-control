import { Injectable } from '@nestjs/common';
import { SshService } from '../../domain/services/ssh.service';
import { SshSession } from '../../domain/services/interfaces/ssh-session.interace';

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
