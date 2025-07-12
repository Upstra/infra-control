import { Test, TestingModule } from '@nestjs/testing';
import { IloPowerController } from '../ilo-power.controller';
import { ControlServerPowerUseCase } from '../../use-cases/control-server-power.use-case';
import { GetServerStatusUseCase } from '../../use-cases/get-server-status.use-case';
import { PingIloUseCase } from '../../use-cases/ping-ilo.use-case';
import { IloPowerAction } from '../../dto/ilo-power-action.dto';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { PingRequestDto } from '@/core/dto/ping.dto';

describe('IloPowerController', () => {
  let controller: IloPowerController;
  let controlServerPowerUseCase: jest.Mocked<ControlServerPowerUseCase>;
  let getServerStatusUseCase: jest.Mocked<GetServerStatusUseCase>;
  let pingIloUseCase: jest.Mocked<PingIloUseCase>;

  beforeEach(async () => {
    const mockControlServerPowerUseCase = {
      execute: jest.fn(),
    };

    const mockGetServerStatusUseCase = {
      execute: jest.fn(),
    };

    const mockPingIloUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IloPowerController],
      providers: [
        {
          provide: ControlServerPowerUseCase,
          useValue: mockControlServerPowerUseCase,
        },
        {
          provide: GetServerStatusUseCase,
          useValue: mockGetServerStatusUseCase,
        },
        {
          provide: PingIloUseCase,
          useValue: mockPingIloUseCase,
        },
      ],
    })
      .overrideGuard('JwtAuthGuard')
      .useValue({ canActivate: () => true })
      .overrideGuard('ResourcePermissionGuard')
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<IloPowerController>(IloPowerController);
    controlServerPowerUseCase = module.get(ControlServerPowerUseCase);
    getServerStatusUseCase = module.get(GetServerStatusUseCase);
    pingIloUseCase = module.get(PingIloUseCase);
  });

  describe('controlServerPower', () => {
    it('should control server power successfully', async () => {
      const serverId = 'server-123';
      const powerActionDto = { action: IloPowerAction.START };
      const expectedResult = {
        success: true,
        message: 'Server started successfully',
        currentStatus: IloServerStatus.ON,
      };

      controlServerPowerUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.controlServerPower(serverId, powerActionDto);

      expect(controlServerPowerUseCase.execute).toHaveBeenCalledWith(serverId, IloPowerAction.START);
      expect(result).toEqual(expectedResult);
    });

    it('should handle power control failure', async () => {
      const serverId = 'server-123';
      const powerActionDto = { action: IloPowerAction.STOP };

      controlServerPowerUseCase.execute.mockRejectedValue(new Error('iLO connection failed'));

      await expect(
        controller.controlServerPower(serverId, powerActionDto)
      ).rejects.toThrow('iLO connection failed');
    });
  });

  describe('getServerStatus', () => {
    it('should get server status successfully', async () => {
      const serverId = 'server-123';
      const expectedResult = {
        status: IloServerStatus.ON,
        ip: '192.168.1.100',
      };

      getServerStatusUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.getServerStatus(serverId);

      expect(getServerStatusUseCase.execute).toHaveBeenCalledWith(serverId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle status check failure', async () => {
      const serverId = 'server-123';

      getServerStatusUseCase.execute.mockRejectedValue(new Error('Server not found'));

      await expect(
        controller.getServerStatus(serverId)
      ).rejects.toThrow('Server not found');
    });
  });

  describe('pingIlo', () => {
    it('should ping iLO successfully', async () => {
      const serverId = 'server-123';
      const pingDto: PingRequestDto = {
        host: '192.168.1.100',
        timeout: 5000,
      };
      const expectedResult = {
        accessible: true,
        host: '192.168.1.100',
        responseTime: 12,
      };

      pingIloUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.pingIlo(serverId, pingDto);

      expect(pingIloUseCase.execute).toHaveBeenCalledWith(serverId, pingDto.host, pingDto.timeout);
      expect(result).toEqual(expectedResult);
    });

    it('should ping iLO with default timeout', async () => {
      const serverId = 'server-123';
      const pingDto: PingRequestDto = {
        host: '192.168.1.100',
      };
      const expectedResult = {
        accessible: true,
        host: '192.168.1.100',
        responseTime: 18,
      };

      pingIloUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.pingIlo(serverId, pingDto);

      expect(pingIloUseCase.execute).toHaveBeenCalledWith(serverId, pingDto.host, undefined);
      expect(result).toEqual(expectedResult);
    });

    it('should handle ping failure for iLO', async () => {
      const serverId = 'server-123';
      const pingDto: PingRequestDto = {
        host: 'unreachable-ilo',
      };
      const expectedResult = {
        accessible: false,
        host: 'unreachable-ilo',
        error: 'iLO not responding',
      };

      pingIloUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.pingIlo(serverId, pingDto);

      expect(pingIloUseCase.execute).toHaveBeenCalledWith(serverId, pingDto.host, undefined);
      expect(result).toEqual(expectedResult);
    });
  });
});