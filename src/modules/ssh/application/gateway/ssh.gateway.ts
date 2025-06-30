import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ClientChannel, Client } from 'ssh2';
import { OpenSshSessionUseCase } from '../use-cases/open-ssh-session.use-case';

@WebSocketGateway({ cors: true, namespace: '/ssh' })
export class SshGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly openSession: OpenSshSessionUseCase) {}

  async handleConnection(client: Socket): Promise<void> {
    const { ip, username, password } = client.handshake.auth as Record<
      string,
      string
    >;
    try {
      const { client: sshClient, shell } = await this.openSession.execute({
        host: ip,
        username,
        password,
      });
      client.data.sshClient = sshClient;
      client.data.shell = shell;
      console.log(`SSH connection established for ${username}@${ip}`);

      shell.on('data', (data: Buffer) => {
        client.emit('ssh:data', data.toString());
      });
      shell.on('close', () => {
        client.emit('ssh:close');
        client.disconnect(true);
      });
    } catch (err) {
      console.error('SSH connection error:', err);
      client.emit('ssh:error', 'Unable to connect');
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    const shell: ClientChannel | undefined = client.data.shell;
    const sshClient: Client | undefined = client.data.sshClient;
    shell?.end();
    sshClient?.end();
  }

  @SubscribeMessage('ssh:data')
  handleData(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): void {
    const shell: ClientChannel | undefined = client.data.shell;
    shell?.write(payload);
  }
}
