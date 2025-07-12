import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetServerByIloIpUseCase } from './get-server-by-ilo-ip.use-case';
import { ServerRepositoryInterface } from '../../domain/interfaces/server.repository.interface';
import { Server } from '../../domain/entities/server.entity';

describe('GetServerByIloIpUseCase', () => {
  let useCase: GetServerByIloIpUseCase;
  let serverRepository: jest.Mocked<ServerRepositoryInterface>;

  const mockIlo = {
    id: 'ilo-1',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
    firmwareVersion: '2.50',
    modelName: 'iLO5',
    status: 'active',
    lastHealthCheck: new Date(),
  } as any;

  const mockServer: Server = {
    id: 'server-1',
    name: 'Test Server',
    ip: '192.168.1.10',
    login: 'root',
    password: 'password',
    state: 'active',
    type: 'physical',
    priority: 1,
    grace_period_on: 300,
    grace_period_off: 120,
    adminUrl: 'https://192.168.1.10',
    ilo: mockIlo,
    iloId: 'ilo-1',
    vms: [],
    permissions: [],
    room: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServerByIloIpUseCase,
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findByIloIp: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetServerByIloIpUseCase>(GetServerByIloIpUseCase);
    serverRepository = module.get('ServerRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return server with matching iLO IP', async () => {
      const ip = '192.168.1.100';
      serverRepository.findByIloIp.mockResolvedValue(mockServer);

      const result = await useCase.execute(ip);

      expect(serverRepository.findByIloIp).toHaveBeenCalledWith(ip);
      expect(result).toEqual(mockServer);
      expect(result.ilo.ip).toBe(ip);
    });

    it('should throw NotFoundException if server is not found', async () => {
      const ip = '192.168.1.200';
      serverRepository.findByIloIp.mockResolvedValue(null);

      await expect(useCase.execute(ip)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(ip)).rejects.toThrow(
        `Server with iLO IP ${ip} not found`,
      );
    });

    it('should handle servers with SSH credentials', async () => {
      const serverWithSsh = {
        ...mockServer,
        login: 'ubuntu',
        password: 'ubuntu-password',
      } as Server;

      const ip = '192.168.1.100';
      serverRepository.findByIloIp.mockResolvedValue(serverWithSsh);

      const result = await useCase.execute(ip);

      expect(result.login).toBe('ubuntu');
      expect(result.password).toBe('ubuntu-password');
    });

    it('should call repository method with correct IP', async () => {
      const testIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];

      for (const ip of testIps) {
        serverRepository.findByIloIp.mockResolvedValue(mockServer);
        await useCase.execute(ip);
        expect(serverRepository.findByIloIp).toHaveBeenCalledWith(ip);
      }
    });

    it('should handle repository errors', async () => {
      const ip = '192.168.1.100';
      serverRepository.findByIloIp.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(ip)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should return server with all relations', async () => {
      const serverWithRelations = {
        ...mockServer,
        group: { id: 'group-1', name: 'Production' },
        room: { id: 'room-1', name: 'Server Room 1' },
        ups: { id: 'ups-1', name: 'UPS-1' },
      } as any;

      const ip = '192.168.1.100';
      serverRepository.findByIloIp.mockResolvedValue(serverWithRelations);

      const result = await useCase.execute(ip);

      expect(result.group).toBeDefined();
      expect(result.room).toBeDefined();
      expect(result.ups).toBeDefined();
    });

    it('should handle different iLO IP formats', async () => {
      const testCases = [
        { ip: '192.168.1.100', valid: true },
        { ip: '10.0.0.1', valid: true },
        { ip: '172.16.254.254', valid: true },
      ];

      for (const testCase of testCases) {
        if (testCase.valid) {
          serverRepository.findByIloIp.mockResolvedValue(mockServer);
          const result = await useCase.execute(testCase.ip);
          expect(result).toBeDefined();
        }
      }
    });
  });
});
