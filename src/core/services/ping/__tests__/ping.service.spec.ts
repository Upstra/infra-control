import { Test, TestingModule } from '@nestjs/testing';
import { PingService } from '../ping.service';
import { spawn } from 'child_process';

jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

describe('PingService', () => {
  let service: PingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PingService],
    }).compile();

    service = module.get<PingService>(PingService);
    jest.clearAllMocks();
  });

  describe('ping', () => {
    it('should return accessible true when ping succeeds', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('64 bytes from 192.168.1.1: time=1.23 ms');
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await service.ping('192.168.1.1');

      expect(result.accessible).toBe(true);
      expect(result.host).toBe('192.168.1.1');
      expect(result.responseTime).toBeDefined();
    });

    it('should return accessible false when ping fails', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('ping: cannot resolve host');
            }
          }),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(1);
          }
        }),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await service.ping('invalid-host');

      expect(result.accessible).toBe(false);
      expect(result.host).toBe('invalid-host');
      expect(result.error).toContain('ping: cannot resolve host');
    });

    it('should handle timeout correctly', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn(),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn(),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const timeout = 100;
      const resultPromise = service.ping('slow-host', timeout);

      // Simulate timeout
      setTimeout(() => {
        const timeoutCallback = mockProcess.on.mock.calls
          .find(call => call[0] === 'close')?.[1];
        if (timeoutCallback) {
          timeoutCallback(0);
        }
      }, timeout + 50);

      const result = await resultPromise;

      expect(result.accessible).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('batchPing', () => {
    it('should ping multiple hosts', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('64 bytes from host: time=1.23 ms');
            }
          }),
        },
        stderr: {
          on: jest.fn(),
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: jest.fn(),
      };

      mockSpawn.mockReturnValue(mockProcess as any);

      const hosts = ['192.168.1.1', '192.168.1.2'];
      const results = await service.batchPing(hosts);

      expect(results).toHaveLength(2);
      expect(results[0].host).toBe('192.168.1.1');
      expect(results[1].host).toBe('192.168.1.2');
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });
  });
});