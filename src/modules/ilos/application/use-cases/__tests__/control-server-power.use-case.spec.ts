import { ControlServerPowerUseCase } from '../control-server-power.use-case';
import { IloPowerAction } from '../../dto/ilo-power-action.dto';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { NotFoundException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';

describe('ControlServerPowerUseCase', () => {
  let useCase: ControlServerPowerUseCase;
  let mockIloPowerService: any;
  let mockGetServerWithIloUseCase: jest.Mocked<GetServerWithIloUseCase>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.10',
    ilo: {
      id: 'ilo-1',
      ip: '192.168.1.100',
      login: 'admin',
      password: 'password123',
      name: 'iLO Server 1',
    },
    name: 'Test Server',
    type: 'esxi',
    priority: 1,
    state: 'UP',
    roomId: 'room-1',
  };

  beforeEach(() => {
    mockIloPowerService = {
      controlServerPower: jest.fn(),
      getServerStatus: jest.fn(),
    };

    mockGetServerWithIloUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetServerWithIloUseCase>;

    useCase = new ControlServerPowerUseCase(
      mockIloPowerService,
      mockGetServerWithIloUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should successfully start a server', async () => {
    const mockResult = {
      success: true,
      message: 'Server started successfully',
      currentStatus: IloServerStatus.ON,
    };

    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.controlServerPower.mockResolvedValue(mockResult);

    const result = await useCase.execute('server-1', IloPowerAction.START);

    expect(result).toEqual({
      success: true,
      message: 'Server started successfully',
      currentStatus: IloServerStatus.ON,
    });
    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith(
      'server-1',
    );
    expect(mockIloPowerService.controlServerPower).toHaveBeenCalledWith(
      '192.168.1.100',
      IloPowerAction.START,
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });

  it('should successfully stop a server', async () => {
    const mockResult = {
      success: true,
      message: 'Server stopped successfully',
      currentStatus: IloServerStatus.OFF,
    };

    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.controlServerPower.mockResolvedValue(mockResult);

    const result = await useCase.execute('server-1', IloPowerAction.STOP);

    expect(result).toEqual({
      success: true,
      message: 'Server stopped successfully',
      currentStatus: IloServerStatus.OFF,
    });
    expect(mockIloPowerService.controlServerPower).toHaveBeenCalledWith(
      '192.168.1.100',
      IloPowerAction.STOP,
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });

  it('should throw error when server is not found', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server with ID server-999 not found'),
    );

    await expect(
      useCase.execute('server-999', IloPowerAction.START),
    ).rejects.toThrow(
      new NotFoundException('Server with ID server-999 not found'),
    );

    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith(
      'server-999',
    );
    expect(mockIloPowerService.controlServerPower).not.toHaveBeenCalled();
  });

  it('should throw error when server has no iLO configured', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    await expect(
      useCase.execute('server-1', IloPowerAction.START),
    ).rejects.toThrow(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    expect(mockIloPowerService.controlServerPower).not.toHaveBeenCalled();
  });

  it('should handle power control failure', async () => {
    const error = new Error('Failed to control server power');
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.controlServerPower.mockRejectedValue(error);

    await expect(
      useCase.execute('server-1', IloPowerAction.START),
    ).rejects.toThrow(error);

    expect(mockIloPowerService.controlServerPower).toHaveBeenCalledWith(
      '192.168.1.100',
      IloPowerAction.START,
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });
});
