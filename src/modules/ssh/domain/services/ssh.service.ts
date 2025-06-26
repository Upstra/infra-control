import { Injectable } from '@nestjs/common';
import { Client } from 'ssh2';
import { SshSession } from './interfaces/ssh-session.interace';
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
