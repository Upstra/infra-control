import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConnectivityValidationGuard, ConnectivityRequirement, CONNECTIVITY_KEY, RequireConnectivity } from '../connectivity-validation.guard';
import { PingService } from '@/core/services/ping';

describe('ConnectivityValidationGuard', () => {
  let guard: ConnectivityValidationGuard;
  let reflector: Reflector;
  let pingService: PingService;
  let mockExecutionContext: ExecutionContext;
  let mockHttpArgumentsHost: any;
  let mockRequest: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectivityValidationGuard,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: PingService,
          useValue: {
            ping: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ConnectivityValidationGuard>(ConnectivityValidationGuard);
    reflector = module.get<Reflector>(Reflector);
    pingService = module.get<PingService>(PingService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockHttpArgumentsHost = {
      getRequest: jest.fn().mockReturnValue(mockRequest),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpArgumentsHost),
      getHandler: jest.fn(),
    } as any;
  });

  describe('canActivate', () => {
    it('should return true when no connectivity requirement is set', async () => {
      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(CONNECTIVITY_KEY, mockExecutionContext.getHandler());
    });

    it('should throw BadRequestException when host is not provided and required', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new BadRequestException('Host not provided in body.host')
      );
    });

    it('should return true when host is not provided but not required', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
        required: false,
      };

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should validate connectivity successfully from body', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      mockRequest.body.host = '192.168.1.1';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockResolvedValue({
        accessible: true,
        responseTime: 10,
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(pingService.ping).toHaveBeenCalledWith('192.168.1.1', undefined);
    });

    it('should validate connectivity successfully from params', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'params',
        hostField: 'ip',
        timeout: 5000,
      };

      mockRequest.params.ip = '10.0.0.1';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockResolvedValue({
        accessible: true,
        responseTime: 15,
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(pingService.ping).toHaveBeenCalledWith('10.0.0.1', 5000);
    });

    it('should validate connectivity successfully from query', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'query',
        hostField: 'server',
      };

      mockRequest.query.server = 'example.com';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockResolvedValue({
        accessible: true,
        responseTime: 20,
      });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(pingService.ping).toHaveBeenCalledWith('example.com', undefined);
    });

    it('should throw BadRequestException when host is not accessible', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      mockRequest.body.host = '192.168.1.1';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockResolvedValue({
        accessible: false,
        error: 'Connection timeout',
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new BadRequestException('Host 192.168.1.1 is not accessible: Connection timeout')
      );
    });

    it('should throw BadRequestException when host is not accessible with unknown error', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      mockRequest.body.host = '192.168.1.1';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockResolvedValue({
        accessible: false,
      });

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new BadRequestException('Host 192.168.1.1 is not accessible: Unknown error')
      );
    });

    it('should throw BadRequestException when ping service throws error', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      mockRequest.body.host = '192.168.1.1';

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);
      jest.spyOn(pingService, 'ping').mockRejectedValue(new Error('Network error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new BadRequestException('Cannot reach host 192.168.1.1: Network error')
      );
    });

    it('should handle nested host fields', async () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'nested',
      };

      mockRequest.body.nested = null;

      jest.spyOn(reflector, 'get').mockReturnValue(requirement);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new BadRequestException('Host not provided in body.nested')
      );
    });
  });

  describe('RequireConnectivity decorator', () => {
    it('should define metadata on method descriptor', () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'body',
        hostField: 'host',
      };

      const target = {};
      const propertyKey = 'testMethod';
      const descriptor = { value: jest.fn() };

      RequireConnectivity(requirement)(target, propertyKey, descriptor);

      const metadata = Reflect.getMetadata(CONNECTIVITY_KEY, descriptor.value);
      expect(metadata).toEqual(requirement);
    });

    it('should define metadata on class when no descriptor', () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'params',
        hostField: 'ip',
      };

      const target = class TestClass {};

      RequireConnectivity(requirement)(target);

      const metadata = Reflect.getMetadata(CONNECTIVITY_KEY, target);
      expect(metadata).toEqual(requirement);
    });

    it('should define metadata on class when descriptor is undefined', () => {
      const requirement: ConnectivityRequirement = {
        hostSource: 'query',
        hostField: 'server',
      };

      const target = {};

      RequireConnectivity(requirement)(target, undefined, undefined);

      const metadata = Reflect.getMetadata(CONNECTIVITY_KEY, target);
      expect(metadata).toEqual(requirement);
    });
  });
});