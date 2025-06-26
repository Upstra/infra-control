import { Client, ClientChannel } from 'ssh2';

export interface SshSession {
  client: Client;
  shell: ClientChannel;
}
