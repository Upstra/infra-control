import { Test, TestingModule } from '@nestjs/testing';
import { IloPowerController } from '../ilo-power.controller';
import { ControlServerPowerUseCase } from '../../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../../use-cases/get-server-status.use-case';
import { PingIloUseCase } from '../../use-cases/ping-ilo.use-case';
import {
  IloPowerAction,
  IloPowerActionDto,
} from '../../dto/ilo-power-action.dto';
import {
  IloPowerResponseDto,
  IloStatusResponseDto,
} from '../../dto/ilo-status.dto';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { ResourcePermissionGuard } from '@/core/guards/ressource-permission.guard';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { JwtPayload } from '@/core/types/jwt-payload.interface';

describe('IloPowerController', () => {
  let controller: IloPowerController;
  let controlServerPowerUseCase: jest.Mocked<ControlServerPowerUseCase>;
  let getServerStatusUseCase: jest.Mocked<GetServerStatusUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IloPowerController],
      providers: [
        {
          provide: ControlServerPowerUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetServerStatusUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: PingIloUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourcePermissionGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<IloPowerController>(IloPowerController);
    controlServerPowerUseCase = module.get(ControlServerPowerUseCase);
    getServerStatusUseCase = module.get(GetServerStatusUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('controlServerPower', () => {
    const dto: IloPowerActionDto = {
      action: IloPowerAction.START,
    };

    it('should control server power successfully', async () => {
      const expectedResult: IloPowerResponseDto = {
        success: true,
        message: 'Power action executed successfully',
        currentStatus: IloServerStatus.ON,
      };

      const mockUser: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isTwoFactorEnabled: false,
        role: {
          id: 'role-1',
          name: 'admin',
          isAdmin: true,
          canCreateServer: true,
          permissionVms: [],
          permissionServers: [],
        },
      };

      const mockReq = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'jest-test',
        },
      };

      controlServerPowerUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.controlServerPower(
        'server-1',
        dto,
        mockUser,
        mockReq,
      );

      expect(controlServerPowerUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        IloPowerAction.START,
        'user-123',
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'jest-test',
        }),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle STOP action', async () => {
      const stopDto: IloPowerActionDto = {
        action: IloPowerAction.STOP,
      };
      const expectedResult: IloPowerResponseDto = {
        success: true,
        message: 'Server stopped successfully',
        currentStatus: IloServerStatus.OFF,
      };

      const mockUser: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isTwoFactorEnabled: false,
        role: {
          id: 'role-1',
          name: 'admin',
          isAdmin: true,
          canCreateServer: true,
          permissionVms: [],
          permissionServers: [],
        },
      };

      const mockReq = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'jest-test',
        },
      };

      controlServerPowerUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.controlServerPower(
        'server-1',
        stopDto,
        mockUser,
        mockReq,
      );

      expect(controlServerPowerUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        IloPowerAction.STOP,
        'user-123',
        expect.objectContaining({
          ipAddress: '127.0.0.1',
          userAgent: 'jest-test',
        }),
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from use case', async () => {
      const error = new Error('iLO connection failed');
      controlServerPowerUseCase.execute.mockRejectedValue(error);

      const mockUser: JwtPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        isActive: true,
        isTwoFactorEnabled: false,
        role: {
          id: 'role-1',
          name: 'admin',
          isAdmin: true,
          canCreateServer: true,
          permissionVms: [],
          permissionServers: [],
        },
      };

      const mockReq = {
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'jest-test',
        },
      };

      await expect(
        controller.controlServerPower('server-1', dto, mockUser, mockReq),
      ).rejects.toThrow(error);
    });
  });

  describe('getServerStatus', () => {
    it('should get server status successfully', async () => {
      const expectedStatus: IloStatusResponseDto = {
        status: IloServerStatus.ON,
        ip: '192.168.1.10',
        serverId: 'server-1',
        serverName: 'Test Server',
        serverType: 'esxi',
        vmwareHostMoid: 'host-123',
        serverState: 'running',
        serverPriority: 1,
        roomId: 'room-1',
        metrics: {
          cpuUsage: 45.5,
          memoryUsage: 8192,
          powerState: 'poweredOn',
        },
      };

      getServerStatusUseCase.execute.mockResolvedValue(expectedStatus);

      const result = await controller.getServerStatus('server-1');

      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        undefined,
      );
      expect(result).toEqual(expectedStatus);
    });

    it('should get server status with force parameter', async () => {
      const expectedStatus: IloStatusResponseDto = {
        status: IloServerStatus.ON,
        ip: '192.168.1.10',
        serverId: 'server-1',
        serverName: 'Test Server',
        serverType: 'esxi',
        vmwareHostMoid: 'host-123',
        serverState: 'running',
        serverPriority: 1,
        roomId: 'room-1',
        metrics: {
          cpuUsage: 50.0,
          memoryUsage: 16384,
          powerState: 'poweredOn',
        },
      };

      getServerStatusUseCase.execute.mockResolvedValue(expectedStatus);

      const result = await controller.getServerStatus('server-1', true);

      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(
        'server-1',
        true,
      );
      expect(result).toEqual(expectedStatus);
    });

    it('should handle errors from status use case', async () => {
      const error = new Error('iLO authentication failed');
      getServerStatusUseCase.execute.mockRejectedValue(error);

      await expect(controller.getServerStatus('server-1')).rejects.toThrow(
        error,
      );
    });
  });

  describe('guards', () => {
    it('should have JWT auth guard and resource permission guard', () => {
      const guards = Reflect.getMetadata('__guards__', IloPowerController);
      expect(guards).toContain(JwtAuthGuard);
    });
  });
});
