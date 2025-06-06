import { Reflector } from '@nestjs/core';
import { PermissionStrategyFactory } from '../strategies/permission-strategy.interface';
import {
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ResourcePermissionGuard } from '../ressource-permission.guard';
import {
  RESOURCE_PERMISSION_KEY,
  ResourcePermissionMetadata,
} from '@/core/decorators/ressource-permission.decorator';

describe('ResourcePermissionGuard', () => {
  let guard: ResourcePermissionGuard;
  let reflector: jest.Mocked<Reflector>;
  let strategyFactory: jest.Mocked<PermissionStrategyFactory>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockRequest: any;
  let mockStrategy: any;

  const mockUser: JwtPayload = {
    userId: 'user-123',
    email: 'user@example.com',
  };

  const mockMetadata: ResourcePermissionMetadata = {
    resourceType: 'server',
    requiredBit: PermissionBit.READ,
    resourceIdSource: 'params',
    resourceIdField: 'serverId',
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as any;

    mockStrategy = {
      checkPermission: jest.fn(),
    };

    strategyFactory = {
      getStrategy: jest.fn().mockReturnValue(mockStrategy),
    } as any;

    mockRequest = {
      user: mockUser,
      params: { serverId: 'server-123' },
      body: {},
      query: {},
    };

    mockContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    } as any;

    guard = new ResourcePermissionGuard(reflector, strategyFactory);
  });

  describe('canActivate', () => {
    describe('Success cases', () => {
      it('should return true when no metadata is present', async () => {
        reflector.get.mockReturnValue(undefined);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(reflector.get).toHaveBeenCalledWith(
          RESOURCE_PERMISSION_KEY,
          mockContext.getHandler(),
        );
        expect(strategyFactory.getStrategy).not.toHaveBeenCalled();
      });

      it('should return true when user has required permission', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockStrategy.checkPermission.mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(reflector.get).toHaveBeenCalledWith(
          RESOURCE_PERMISSION_KEY,
          mockContext.getHandler(),
        );
        expect(strategyFactory.getStrategy).toHaveBeenCalledWith('server');
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-123',
          PermissionBit.READ,
        );
      });

      it('should work with different resource ID sources (body)', async () => {
        const bodyMetadata: ResourcePermissionMetadata = {
          ...mockMetadata,
          resourceIdSource: 'body',
          resourceIdField: 'serverId',
        };
        mockRequest.body = { serverId: 'server-456' };

        reflector.get.mockReturnValue(bodyMetadata);
        mockStrategy.checkPermission.mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-456',
          PermissionBit.READ,
        );
      });

      it('should work with different resource ID sources (query)', async () => {
        const queryMetadata: ResourcePermissionMetadata = {
          ...mockMetadata,
          resourceIdSource: 'query',
          resourceIdField: 'serverId',
        };
        mockRequest.query = { serverId: 'server-789' };

        reflector.get.mockReturnValue(queryMetadata);
        mockStrategy.checkPermission.mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-789',
          PermissionBit.READ,
        );
      });
    });

    describe('Authentication errors', () => {
      it('should throw ForbiddenException when user is not authenticated', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockRequest.user = undefined;

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new ForbiddenException('User not authenticated'),
        );

        expect(strategyFactory.getStrategy).not.toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
      });

      it('should throw ForbiddenException when user is null', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockRequest.user = null;

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new ForbiddenException('User not authenticated'),
        );
      });
    });

    describe('Resource ID validation errors', () => {
      it('should throw BadRequestException when resource ID is missing', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockRequest.params = {}; // Pas de serverId

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new BadRequestException('server ID is required for this operation'),
        );

        expect(strategyFactory.getStrategy).not.toHaveBeenCalled();
        expect(mockStrategy.checkPermission).not.toHaveBeenCalled();
      });

      it('should throw BadRequestException when resource ID is null', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockRequest.params = { serverId: null };

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new BadRequestException('server ID is required for this operation'),
        );
      });

      it('should throw BadRequestException when resource ID is empty string', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockRequest.params = { serverId: '' };

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new BadRequestException('server ID is required for this operation'),
        );
      });

      it('should throw BadRequestException when source object is missing', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        delete mockRequest.params; // Source manquante

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new BadRequestException('server ID is required for this operation'),
        );
      });
    });

    describe('Permission errors', () => {
      it('should throw ForbiddenException when user lacks required permission', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        mockStrategy.checkPermission.mockResolvedValue(false);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new ForbiddenException(
            `You need ${PermissionBit[PermissionBit.READ]} permission on the server`,
          ),
        );

        expect(strategyFactory.getStrategy).toHaveBeenCalledWith('server');
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'server-123',
          PermissionBit.READ,
        );
      });

      it('should show correct permission name for different bits', async () => {
        const writeMetadata = {
          ...mockMetadata,
          requiredBit: PermissionBit.WRITE,
        };
        reflector.get.mockReturnValue(writeMetadata);
        mockStrategy.checkPermission.mockResolvedValue(false);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          new ForbiddenException(
            `You need ${PermissionBit[PermissionBit.WRITE]} permission on the server`,
          ),
        );
      });
    });

    describe('Different resource types', () => {
      it('should work with VM resource type', async () => {
        const vmMetadata: ResourcePermissionMetadata = {
          resourceType: 'vm',
          requiredBit: PermissionBit.SHUTDOWN,
          resourceIdSource: 'params',
          resourceIdField: 'vmId',
        };
        mockRequest.params = { vmId: 'vm-123' };

        reflector.get.mockReturnValue(vmMetadata);
        mockStrategy.checkPermission.mockResolvedValue(true);

        const result = await guard.canActivate(mockContext);

        expect(result).toBe(true);
        expect(strategyFactory.getStrategy).toHaveBeenCalledWith('vm');
        expect(mockStrategy.checkPermission).toHaveBeenCalledWith(
          'user-123',
          'vm-123',
          PermissionBit.SHUTDOWN,
        );
      });
    });

    describe('Strategy factory errors', () => {
      it('should propagate errors from strategy factory', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        const strategyError = new Error('Unknown resource type: invalid');
        strategyFactory.getStrategy.mockImplementation(() => {
          throw strategyError;
        });

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          strategyError,
        );
      });

      it('should propagate errors from strategy checkPermission', async () => {
        reflector.get.mockReturnValue(mockMetadata);
        const permissionError = new Error('Database connection failed');
        mockStrategy.checkPermission.mockRejectedValue(permissionError);

        await expect(guard.canActivate(mockContext)).rejects.toThrow(
          permissionError,
        );
      });
    });
  });

  describe('extractResourceId', () => {
    it('should extract resource ID from different sources', () => {
      const testCases = [
        {
          source: 'params' as const,
          field: 'serverId',
          request: { params: { serverId: 'server-123' } },
          expected: 'server-123',
        },
        {
          source: 'body' as const,
          field: 'resourceId',
          request: { body: { resourceId: 'resource-456' } },
          expected: 'resource-456',
        },
        {
          source: 'query' as const,
          field: 'id',
          request: { query: { id: 'query-789' } },
          expected: 'query-789',
        },
      ];

      testCases.forEach(({ source, field, request, expected }) => {
        const metadata: ResourcePermissionMetadata = {
          resourceType: 'server',
          requiredBit: PermissionBit.READ,
          resourceIdSource: source,
          resourceIdField: field,
        };

        const result = (guard as any).extractResourceId(request, metadata);
        expect(result).toBe(expected);
      });
    });

    it('should return null when source is missing', () => {
      const metadata: ResourcePermissionMetadata = {
        resourceType: 'server',
        requiredBit: PermissionBit.READ,
        resourceIdSource: 'params',
        resourceIdField: 'id',
      };

      const result = (guard as any).extractResourceId({}, metadata);
      expect(result).toBeNull();
    });

    it('should return null when field is missing', () => {
      const metadata: ResourcePermissionMetadata = {
        resourceType: 'vm',
        requiredBit: PermissionBit.READ,
        resourceIdSource: 'params',
        resourceIdField: 'missingField',
      };

      const request = { params: { id: 'test-123' } };
      const result = (guard as any).extractResourceId(request, metadata);
      expect(result).toBeNull();
    });
  });
});
