const instances: any[] = [];
jest.mock('ssh2', () => {
  const { EventEmitter } = require('events');
  return {
    Client: jest.fn(() => {
      const client = new EventEmitter();
      client.connect = jest.fn();
      client.end = jest.fn();
      client.shell = jest.fn((cb) => {
        client.shellCallback = cb;
      });
      instances.push(client);
      return client;
    }),
  };
});

import { SshService } from '../ssh.service';
import { EventEmitter } from 'events';

class MockStream extends EventEmitter {
  end = jest.fn();
  write = jest.fn();
}

describe('SshService', () => {
  it('should resolve session on ready', async () => {
    const service = new SshService();
    const promise = service.createSession({
      host: 'h',
      username: 'u',
      password: 'p',
    });
    const client = instances[0];
    const stream = new MockStream();
    client.emit('ready');
    client.shellCallback(null, stream);
    const session = await promise;
    expect(session.client).toBe(client);
    expect(session.shell).toBe(stream);
    expect(client.connect).toHaveBeenCalledWith({
      host: 'h',
      username: 'u',
      password: 'p',
    });
  });

  it('should reject on error', async () => {
    const service = new SshService();
    const promise = service.createSession({
      host: 'h',
      username: 'u',
      password: 'p',
    });
    const client = instances[1];
    const error = new Error('fail');
    client.emit('error', error);
    await expect(promise).rejects.toThrow('fail');
  });
});
