import { ConnectivityException, TimeoutException, HostUnreachableException } from '../connectivity.exception';
import { BadRequestException } from '@nestjs/common';

describe('Connectivity Exceptions', () => {
  describe('ConnectivityException', () => {
    it('should create exception with host only', () => {
      const exception = new ConnectivityException('192.168.1.1');
      
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception).toBeInstanceOf(ConnectivityException);
      expect(exception.message).toBe('Host 192.168.1.1 is not accessible');
    });

    it('should create exception with host and error message', () => {
      const exception = new ConnectivityException('example.com', 'Connection refused');
      
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception).toBeInstanceOf(ConnectivityException);
      expect(exception.message).toBe('Host example.com is not accessible: Connection refused');
    });

    it('should handle empty error message', () => {
      const exception = new ConnectivityException('10.0.0.1', '');
      
      expect(exception.message).toBe('Host 10.0.0.1 is not accessible');
    });

    it('should handle undefined error message', () => {
      const exception = new ConnectivityException('localhost', undefined);
      
      expect(exception.message).toBe('Host localhost is not accessible');
    });
  });

  describe('TimeoutException', () => {
    it('should create timeout exception with host and timeout duration', () => {
      const exception = new TimeoutException('192.168.1.100', 5000);
      
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception).toBeInstanceOf(TimeoutException);
      expect(exception.message).toBe('Connection to 192.168.1.100 timed out after 5000ms');
    });

    it('should handle zero timeout', () => {
      const exception = new TimeoutException('api.example.com', 0);
      
      expect(exception.message).toBe('Connection to api.example.com timed out after 0ms');
    });

    it('should handle very large timeout values', () => {
      const exception = new TimeoutException('slow-server.com', 300000);
      
      expect(exception.message).toBe('Connection to slow-server.com timed out after 300000ms');
    });
  });

  describe('HostUnreachableException', () => {
    it('should create host unreachable exception with IP address', () => {
      const exception = new HostUnreachableException('10.20.30.40');
      
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception).toBeInstanceOf(HostUnreachableException);
      expect(exception.message).toBe('Host 10.20.30.40 is unreachable - please check network connectivity');
    });

    it('should create host unreachable exception with domain name', () => {
      const exception = new HostUnreachableException('unreachable.example.com');
      
      expect(exception.message).toBe('Host unreachable.example.com is unreachable - please check network connectivity');
    });

    it('should handle localhost', () => {
      const exception = new HostUnreachableException('localhost');
      
      expect(exception.message).toBe('Host localhost is unreachable - please check network connectivity');
    });
  });
});