import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetServerByIloIpUseCase } from './get-server-by-ilo-ip.use-case';
import { IServerRepository } from '../../domain/interfaces/server.repository.interface';
import { Server } from '../../domain/entities/server.entity';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';

describe('GetServerByIloIpUseCase', () => {
  let useCase: GetServerByIloIpUseCase;
  let serverRepository: jest.Mocked<IServerRepository>;

  const mockServer = createMockServer({
    id: 'server-1',
    iloIp: '192.168.1.100',
  });

  beforeEach(async () => {
    const mockServerRepository = {
      findByIloIp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetServerByIloIpUseCase,
        {
          provide: 'IServerRepository',
          useValue: mockServerRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetServerByIloIpUseCase>(GetServerByIloIpUseCase);
    serverRepository = module.get('IServerRepository');
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(useCase).toBeDefined();
    });

    it('should have serverRepository injected', () => {
      expect(serverRepository).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should return server when found by iLO IP', async () => {
      serverRepository.findByIloIp.mockResolvedValue(mockServer);

      const result = await useCase.execute('192.168.1.100');

      expect(serverRepository.findByIloIp).toHaveBeenCalledWith('192.168.1.100');
      expect(result).toEqual(mockServer);
    });

    it('should throw NotFoundException when server is not found', async () => {
      serverRepository.findByIloIp.mockResolvedValue(null);

      await expect(useCase.execute('192.168.1.100')).rejects.toThrow(
        new NotFoundException('Server with iLO IP 192.168.1.100 not found'),
      );

      expect(serverRepository.findByIloIp).toHaveBeenCalledWith('192.168.1.100');
    });

    it('should handle different iLO IP formats', async () => {
      const differentIPs = [
        '10.0.0.1',
        '172.16.0.1',
        '192.168.255.255',
      ];

      for (const ip of differentIPs) {
        serverRepository.findByIloIp.mockResolvedValue({ ...mockServer, iloIp: ip });
        
        const result = await useCase.execute(ip);
        
        expect(result.iloIp).toBe(ip);
        expect(serverRepository.findByIloIp).toHaveBeenCalledWith(ip);
      }
    });

    it('should throw NotFoundException with correct message for any IP', async () => {
      const testIPs = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];

      for (const ip of testIPs) {
        serverRepository.findByIloIp.mockResolvedValue(null);

        await expect(useCase.execute(ip)).rejects.toThrow(
          new NotFoundException(`Server with iLO IP ${ip} not found`),
        );
      }
    });

    it('should propagate repository errors', async () => {
      const repositoryError = new Error('Database connection failed');
      serverRepository.findByIloIp.mockRejectedValue(repositoryError);

      await expect(useCase.execute('192.168.1.100')).rejects.toThrow(repositoryError);
    });

    it('should return server with all properties when found', async () => {
      const completeServer = createMockServer({
        ssh_key: 'ssh-rsa AAAAB3...',
        ssh_port: 22,
        ssh_user: 'root',
        vmwareHostMoid: 'host-123',
        firewall: true,
        os: 'Ubuntu 22.04',
        iloIp: '192.168.1.100',
      });

      serverRepository.findByIloIp.mockResolvedValue(completeServer);

      const result = await useCase.execute('192.168.1.100');

      expect(result).toEqual(completeServer);
      expect(result.ssh_key).toBe('ssh-rsa AAAAB3...');
      expect(result.vmwareHostMoid).toBe('host-123');
    });
  });
});