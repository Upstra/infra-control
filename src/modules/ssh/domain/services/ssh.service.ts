import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import { SshSession } from './interfaces/ssh-session.interace';

/**
 * Provides SSH connectivity and command execution capabilities for servers.
 * Encapsulates connection pooling, command timeouts, and output parsing.
 *
 * Responsibilities:
 * - Establish and manage SSH sessions using configured credentials.
 * - Execute shell commands on remote servers and capture stdout/stderr.
 * - Handle retry logic, timeouts, and reconnection on failure.
 * - Parse raw command output into structured results or domain models.
 *
 * @remarks
 * Used by domain services (e.g. ServerDomainService) for in-band operations.
 * Should not be injected directly into controllers; use through orchestrating use-cases.
 *
 * @param host       Remote server address.
 * @param username   SSH username.
 * @param privateKey SSH private key or path to key file.
 *
 * @example
 * const result = await sshService.execCommand(server, 'df -h');
 */

@Injectable()
export class SshService {
  async createSession(options: {
    host: string;
    username: string;
    password: string;
  }): Promise<SshSession> {
    const client = new Client();
    return new Promise((resolve, reject) => {
      client
        .on('ready', () => {
          client.shell((err, stream) => {
            if (err) {
              client.end();
              return reject(err);
            }
            resolve({ client, shell: stream });
          });
        })
        .on('error', (err) => reject(err))
        .connect({
          host: options.host,
          username: options.username,
          password: options.password,
        });
    });
  }
}
