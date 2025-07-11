import { GetServerStatusUseCase } from '../get-server-status.use-case';
import { IloServerStatus } from '../../dto/ilo-status.dto';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('GetServerStatusUseCase', () => {
  let useCase: GetServerStatusUseCase;
  let mockIloPowerService: any;
  let mockServerRepository: jest.Mocked<Repository<any>>;

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
  };

  beforeEach(() => {
    mockIloPowerService = {
      controlServerPower: jest.fn(),
      getServerStatus: jest.fn(),
    };

    mockServerRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<any>>;

    useCase = new GetServerStatusUseCase(
      mockIloPowerService,
      mockServerRepository,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should get server status successfully', async () => {
    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockIloPowerService.getServerStatus.mockResolvedValue(IloServerStatus.ON);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.ON,
      ip: '192.168.1.100',
    });
    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-1' },
      relations: ['ilo'],
    });
    expect(mockIloPowerService.getServerStatus).toHaveBeenCalledWith(
      '192.168.1.100',
      {
        user: 'admin',
        password: 'password123',
      },
    );
  });

  it('should return OFF status', async () => {
    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockIloPowerService.getServerStatus.mockResolvedValue(IloServerStatus.OFF);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({
      status: IloServerStatus.OFF,
      ip: '192.168.1.100',
    });
  });

  it('should return ERROR status', async () => {
    mockServerRepository.findOne.mockResolvedValue(mockServer);
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
    mockServerRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute('server-999')).rejects.toThrow(
      new NotFoundException('Server with ID server-999 not found'),
    );

    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-999' },
      relations: ['ilo'],
    });
    expect(mockIloPowerService.getServerStatus).not.toHaveBeenCalled();
  });

  it('should throw error when server has no iLO configured', async () => {
    const serverWithoutIlo = { ...mockServer, ilo: null };
    mockServerRepository.findOne.mockResolvedValue(serverWithoutIlo);

    await expect(useCase.execute('server-1')).rejects.toThrow(
      new NotFoundException('Server server-1 does not have an iLO configured'),
    );

    expect(mockIloPowerService.getServerStatus).not.toHaveBeenCalled();
  });

  it('should handle iLO service errors', async () => {
    const error = new Error('Failed to connect to iLO');
    mockServerRepository.findOne.mockResolvedValue(mockServer);
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
