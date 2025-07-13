import { Test, TestingModule } from '@nestjs/testing';
import { PingController } from '../ping.controller';
import { PingHostnameUseCase } from '../../use-cases/ping-hostname.use-case';
import { PingResponseDto } from '../../dto/ping-response.dto';

describe('PingController', () => {
  let controller: PingController;
  let pingHostnameUseCase: PingHostnameUseCase;

  const mockPingResponse: PingResponseDto = {
    hostname: '192.168.1.100',
    accessible: true,
    responseTime: 15,
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PingController],
      providers: [
        {
          provide: PingHostnameUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PingController>(PingController);
    pingHostnameUseCase = module.get<PingHostnameUseCase>(PingHostnameUseCase);
  });

  describe('pingHostname', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
      expect(controller.pingHostname).toBeDefined();
    });

    it('should call pingHostnameUseCase with correct hostname', async () => {
      const hostname = '192.168.1.100';
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(mockPingResponse);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(pingHostnameUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPingResponse);
    });

    it('should handle domain names', async () => {
      const hostname = 'example.com';
      const domainResponse: PingResponseDto = {
        ...mockPingResponse,
        hostname,
      };
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(domainResponse);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(result).toEqual(domainResponse);
    });

    it('should handle localhost', async () => {
      const hostname = 'localhost';
      const localhostResponse: PingResponseDto = {
        ...mockPingResponse,
        hostname,
        responseTime: 1,
      };
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(localhostResponse);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(result).toEqual(localhostResponse);
    });

    it('should handle unreachable hosts', async () => {
      const hostname = '10.0.0.1';
      const unreachableResponse: PingResponseDto = {
        hostname,
        accessible: false,
        responseTime: null,
        timestamp: new Date(),
        error: 'Host unreachable',
      };
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(unreachableResponse);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(result).toEqual(unreachableResponse);
    });

    it('should propagate errors from use case', async () => {
      const hostname = 'invalid-host';
      const error = new Error('Invalid hostname format');
      jest.spyOn(pingHostnameUseCase, 'execute').mockRejectedValue(error);

      await expect(controller.pingHostname(hostname)).rejects.toThrow(error);
      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
    });

    it('should handle IPv6 addresses', async () => {
      const hostname = '2001:db8::1';
      const ipv6Response: PingResponseDto = {
        ...mockPingResponse,
        hostname,
      };
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(ipv6Response);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(result).toEqual(ipv6Response);
    });

    it('should handle special characters in hostname', async () => {
      const hostname = 'sub-domain.example.com';
      const specialResponse: PingResponseDto = {
        ...mockPingResponse,
        hostname,
      };
      jest.spyOn(pingHostnameUseCase, 'execute').mockResolvedValue(specialResponse);

      const result = await controller.pingHostname(hostname);

      expect(pingHostnameUseCase.execute).toHaveBeenCalledWith(hostname);
      expect(result).toEqual(specialResponse);
    });
  });
});