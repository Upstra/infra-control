import { SshGateway } from '../ssh.gateway';
import { OpenSshSessionUseCase } from '../../use-cases/open-ssh-session.use-case';
import { Socket } from 'socket.io';

describe('SshGateway', () => {
  let gateway: SshGateway;
  let useCase: jest.Mocked<OpenSshSessionUseCase>;
  let client: Partial<Socket> & { data: any };
  let shell: any;
  let sshClient: any;

  beforeEach(() => {
    shell = {
      on: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    sshClient = { end: jest.fn() };
    useCase = {
      execute: jest.fn().mockResolvedValue({ client: sshClient, shell }),
    } as any;
    gateway = new SshGateway(useCase);
    client = {
      handshake: { auth: { ip: '1', username: 'u', password: 'p' } },
      emit: jest.fn(),
      disconnect: jest.fn(),
      data: {},
    } as any;
  });

  it('should open session on connection and forward data', async () => {
    let dataCallback: (d: Buffer) => void = () => {};
    shell.on.mockImplementation((event: string, cb: any) => {
      if (event === 'data') dataCallback = cb;
    });
    await gateway.handleConnection(client as Socket);
    expect(useCase.execute).toHaveBeenCalledWith({
      host: '1',
      username: 'u',
      password: 'p',
    });
    dataCallback(Buffer.from('hello'));
    expect(client.emit).toHaveBeenCalledWith('ssh:data', 'hello');
  });

  it('should send data to shell', () => {
    client.data.shell = shell;
    gateway.handleData(client as Socket, 'cmd');
    expect(shell.write).toHaveBeenCalledWith('cmd');
  });

  it('should close session on disconnect', () => {
    client.data.shell = shell;
    client.data.sshClient = sshClient;
    gateway.handleDisconnect(client as Socket);
    expect(shell.end).toHaveBeenCalled();
    expect(sshClient.end).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    useCase.execute.mockRejectedValue(new Error('fail'));
    await gateway.handleConnection(client as Socket);
    expect(client.emit).toHaveBeenCalledWith('ssh:error', 'Unable to connect');
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });
});
