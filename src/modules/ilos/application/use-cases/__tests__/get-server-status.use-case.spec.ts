import { GetServerStatusUseCase } from '../get-server-status.use-case';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { NotFoundException } from '@nestjs/common';
import { GetServerWithIloUseCase } from '@/modules/servers/application/use-cases/get-server-with-ilo.use-case';

describe('GetServerStatusUseCase', () => {
  let useCase: GetServerStatusUseCase;
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
    grace_period_on: 300,
    grace_period_off: 300,
    type: 'physical',
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

    useCase = new GetServerStatusUseCase(
      mockIloPowerService,
      mockGetServerWithIloUseCase,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should get server status successfully', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.getServerStatus.mockResolvedValue(IloServerStatus.ON);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.ON,
      ip: '192.168.1.100',
    });
    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith('server-1');
    expect(mockIloPowerService.getServerStatus).toHaveBeenCalledWith(
      '192.168.1.100',
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });

  it('should return OFF status', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.getServerStatus.mockResolvedValue(IloServerStatus.OFF);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.OFF,
      ip: '192.168.1.100',
    });
  });

  it('should return ERROR status', async () => {
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.getServerStatus.mockResolvedValue(
      IloServerStatus.ERROR,
    );

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.ERROR,
      ip: '192.168.1.100',
    });
  });

  it('should throw error when server is not found', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server with ID server-999 not found'),
    );

    await expect(useCase.execute('server-999')).rejects.toThrow(
      new NotFoundException('Server with ID server-999 not found'),
    );

    expect(mockGetServerWithIloUseCase.execute).toHaveBeenCalledWith('server-999');
    expect(mockIloPowerService.getServerStatus).not.toHaveBeenCalled();
  });

  it('should throw error when server has no iLO configured', async () => {
    mockGetServerWithIloUseCase.execute.mockRejectedValue(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    await expect(useCase.execute('server-1')).rejects.toThrow(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    expect(mockIloPowerService.getServerStatus).not.toHaveBeenCalled();
  });

  it('should handle iLO service errors', async () => {
    const error = new Error('Failed to connect to iLO');
    mockGetServerWithIloUseCase.execute.mockResolvedValue(mockServer as any);
    mockIloPowerService.getServerStatus.mockRejectedValue(error);

    await expect(useCase.execute('server-1')).rejects.toThrow(error);

    expect(mockIloPowerService.getServerStatus).toHaveBeenCalledWith(
      '192.168.1.100',
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });
});