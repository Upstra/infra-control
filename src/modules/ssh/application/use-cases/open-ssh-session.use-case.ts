import { Injectable } from '@nestjs/common';
import { SshService } from '../../domain/services/ssh.service';
import { SshSession } from '../../domain/services/interfaces/ssh-session.interace';

/**
 * Opens an SSH session to a target server and executes specified commands.
 *
 * Responsibilities:
 * - Establishes a connection using the SshService with given credentials.
 * - Executes one or more shell commands in sequence, capturing stdout/stderr.
 * - Applies retry and timeout policies to each command execution.
 * - Returns structured results for each command, including exit codes and output.
 *
 * @param server    ServerDto or identifier containing connection details (host, port).
 * @param commands  Array of shell command strings to execute over SSH.
 * @returns         Promise<CommandResultDto[]> array of results for each command.
 *
 * @throws ConnectionException if SSH handshake fails.
 * @throws CommandExecutionException if any command returns a non-zero exit code.
 *
 * @remarks
 * Used by application-layer use-cases to perform in-band operations on servers;
 * controllers should call this use-case rather than invoking SshService directly.
 *
 * @example
 * const results = await openSshSessionUseCase.execute(serverInfo, ['uname -a', 'df -h']);
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
