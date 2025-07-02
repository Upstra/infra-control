import { Injectable } from '@nestjs/common';
import { SshService } from '../../domain/services/ssh.service';
import { SshSession } from '../../domain/services/interfaces/ssh-session.interace';

/**
 * Opens an SSH session to a target server using password authentication.
 *
 * Responsibilities:
 * - Establishes a basic SSH connection using the SshService with provided credentials.
 * - Returns a raw SshSession object containing client and shell stream.
 *
 * @param options  Object containing connection details: host, username, and password.
 * @returns        Promise<SshSession> containing SSH client and shell stream for manual interaction.
 *
 * @remarks
 * Used by application-layer use-cases to establish SSH connections.
 * Returns low-level SSH objects that require manual command execution and cleanup.
 *
 * @example
 * const session = await openSshSessionUseCase.execute({
 *   host: '192.168.1.100',
 *   username: 'admin',
 *   password: 'secret'
 * });
 */

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
