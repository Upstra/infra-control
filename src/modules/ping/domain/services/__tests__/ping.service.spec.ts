import { Test, TestingModule } from '@nestjs/testing';
import { execFile } from 'child_process';
import { PingService, isPingableHost } from '../ping.service';

// The service runs `ping` through execFile (no shell). Each call is routed to
// mockExecAsync(file, args, options), which resolves { stdout, stderr }.
jest.mock('child_process', () => ({ execFile: jest.fn() }));

describe('PingService', () => {
  let service: PingService;
  let mockExecAsync: jest.Mock;
  let originalPlatform: PropertyDescriptor;

  beforeEach(async () => {
    mockExecAsync = jest.fn();
    (execFile as unknown as jest.Mock).mockImplementation(
      (file, args, options, callback) => {
        mockExecAsync(file, args, options).then(
          (value: unknown) => callback(null, value),
          (error: unknown) => callback(error),
        );
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [PingService],
    }).compile();

    service = module.get<PingService>(PingService);
    originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform);
    }
  });

  // The target comes from the request URL (/ping/hostname/:hostname).
  describe('command injection', () => {
    it.each(['8.8.8.8;id', 'host && reboot', '$(whoami)', '`id`', '-c 99 host', 'a|b', ''])(
      'refuses %p without running anything',
      async (target) => {
        const result = await service.pingHost(target);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid hostname or IP address');
        expect(execFile).not.toHaveBeenCalled();
      },
    );

    it('passes the target as a separate argument, never through a shell', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '64 bytes from 1.1.1.1', stderr: '' });

      await service.pingHost('example.com');

      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping',
        ['-c', '1', '-W', '2', 'example.com'],
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('accepts IPv4, IPv6 and hostnames', () => {
      ['192.168.1.1', '2001:db8::2', 'mock-ilo-1', 'vcenter.lab.local'].forEach(
        (host) => expect(isPingableHost(host)).toBe(true),
      );
    });
  });

  describe('pingHost', () => {
    it('should return success with response time for successful ping on Linux', async () => {
      mockExecAsync.mockResolvedValue({
        stdout:
          'PING example.com (93.184.216.34) 56(84) bytes of data.\n64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=10.5 ms\n\n--- example.com ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss, time 0ms',
        stderr: '',
      });

      const result = await service.pingHost('example.com');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping',
        ['-c', '1', '-W', '2', 'example.com'],
        expect.anything(),
      );
    });

    it('should return success with response time for successful ping on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true,
      });

      mockExecAsync.mockResolvedValue({
        stdout:
          'Pinging example.com [93.184.216.34] with 32 bytes of data:\nReply from 93.184.216.34: bytes=32 time=10ms TTL=56\n\nPing statistics for 93.184.216.34:\n    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss)',
        stderr: '',
      });

      const result = await service.pingHost('example.com');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping',
        ['-n', '1', '-w', '2000', 'example.com'],
        expect.anything(),
      );
    });

    it('should return failure when host is unreachable', async () => {
      mockExecAsync.mockResolvedValue({
        stdout:
          'PING 192.168.1.100 (192.168.1.100) 56(84) bytes of data.\n\n--- 192.168.1.100 ping statistics ---\n1 packets transmitted, 0 received, 100% packet loss, time 0ms',
        stderr: '',
      });

      const result = await service.pingHost('192.168.1.100');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from host');
      expect(result.responseTime).toBeUndefined();
    });

    it('should return failure with stderr message', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: 'ping: cannot resolve unknown.host: Unknown host',
      });

      const result = await service.pingHost('unknown.host');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'ping: cannot resolve unknown.host: Unknown host',
      );
      expect(result.responseTime).toBeUndefined();
    });

    it('should handle exec command failure', async () => {
      const error = new Error('Command failed');
      mockExecAsync.mockRejectedValue(error);

      const result = await service.pingHost('example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Command failed');
      expect(result.responseTime).toBeUndefined();
    });

    it('should handle exec command failure without message', async () => {
      const error = new Error();
      mockExecAsync.mockRejectedValue(error);

      const result = await service.pingHost('example.com');

      expect(result.success).toBe(false);
      // Caught inside the ICMP step, which reports its own fallback message.
      expect(result.error).toBe('Ping command failed');
    });

    it('should handle performICMPPing error with no message', async () => {
      const error = {};
      mockExecAsync.mockRejectedValue(error);

      const result = await service.pingHost('example.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ping command failed');
    });

    it('should handle IPv6 addresses', async () => {
      mockExecAsync.mockResolvedValue({
        stdout:
          'PING6(56=40+8+8 bytes) 2001:db8::1 --> 2001:db8::2\n16 bytes from 2001:db8::2, icmp_seq=0 hlim=64 time=0.123 ms\n\n--- 2001:db8::2 ping6 statistics ---\n1 packets transmitted, 1 packets received, 0.0% packet loss',
        stderr: '',
      });

      const result = await service.pingHost('2001:db8::2');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
      expect(mockExecAsync).toHaveBeenCalledWith(
        'ping',
        ['-c', '1', '-W', '2', '2001:db8::2'],
        expect.anything(),
      );
    });

    it('should handle localhost', async () => {
      mockExecAsync.mockResolvedValue({
        stdout:
          'PING localhost (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.033 ms\n\n--- localhost ping statistics ---\n1 packets transmitted, 1 packets received, 0.0% packet loss',
        stderr: '',
      });

      const result = await service.pingHost('localhost');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
    });

    it('should handle alternative success pattern with "packets" plural', async () => {
      mockExecAsync.mockResolvedValue({
        stdout:
          'PING test.com (1.2.3.4) 56(84) bytes of data.\n64 bytes from 1.2.3.4: icmp_seq=1 ttl=56 time=10.5 ms\n\n--- test.com ping statistics ---\n1 packets transmitted, 1 packets received, 0% packet loss, time 0ms',
        stderr: '',
      });

      const result = await service.pingHost('test.com');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
    });

    it('should handle response with "bytes from" pattern', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.23 ms',
        stderr: '',
      });

      const result = await service.pingHost('192.168.1.1');

      expect(result.success).toBe(true);
      expect(result.responseTime).toBeDefined();
    });

    it('should handle empty stdout and stderr', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const result = await service.pingHost('192.168.1.1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from host');
    });
  });
});
