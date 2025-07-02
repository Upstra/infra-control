import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import { SshSession } from './interfaces/ssh-session.interace';

/**
 * Provides basic SSH connectivity for establishing shell sessions to remote servers.
 *
 * Responsibilities:
 * - Establish SSH sessions using password-based authentication.
 * - Return raw SSH client and shell stream objects for direct interaction.
 *
 * @remarks
 * Used by domain services for creating SSH connections. Returns low-level
 * SSH2 Client and Stream objects that require manual management.
 * Currently supports only password authentication.
 *
 * @example
 * const session = await sshService.createSession({
 *   host: '192.168.1.100',
 *   username: 'admin',
 *   password: 'secret'
 * });
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
