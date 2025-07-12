import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MigrateVmUseCase, VmMigrationResult } from './migrate-vm.use-case';
import { VmwareService } from '../../domain/services/vmware.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Server } from '../../../servers/domain/entities/server.entity';
import { Repository } from 'typeorm';

describe('MigrateVmUseCase', () => {
  let useCase: MigrateVmUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.100',
    login: 'admin',
    password: 'password',
  } as Server;

  const mockMigrationResult: VmMigrationResult = {
    success: true,
    message: 'VM successfully migrated',
    newHost: 'esxi-host-2',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrateVmUseCase,
        {
          provide: VmwareService,
          useValue: {
            migrateVM: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Server),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<MigrateVmUseCase>(MigrateVmUseCase);
    vmwareService = module.get(VmwareService);
    serverRepository = module.get(getRepositoryToken(Server));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should successfully migrate a VM', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockResolvedValue(mockMigrationResult);

      const result = await useCase.execute('server-1', 'vm-123', 'host-2');

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.migrateVM).toHaveBeenCalledWith('vm-123', 'host-2', {
        host: '192.168.1.100',
        user: 'admin',
        password: 'password',
        port: 443,
      });
      expect(result).toEqual(mockMigrationResult);
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if server does not exist', async () => {
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute('server-1', 'vm-123', 'host-2'),
      ).rejects.toThrow(NotFoundException);

      expect(serverRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'server-1' },
      });
      expect(vmwareService.migrateVM).not.toHaveBeenCalled();
    });

    it('should handle migration failure', async () => {
      const failureResult: VmMigrationResult = {
        success: false,
        message: 'Migration failed: Insufficient resources on target host',
        newHost: '',
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockResolvedValue(failureResult);

      const result = await useCase.execute('server-1', 'vm-123', 'host-2');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Migration failed');
      expect(result.newHost).toBe('');
    });

    it('should pass correct connection parameters', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockResolvedValue(mockMigrationResult);

      await useCase.execute('server-1', 'vm-123', 'host-2');

      expect(vmwareService.migrateVM).toHaveBeenCalledWith('vm-123', 'host-2', {
        host: mockServer.ip,
        user: mockServer.login,
        password: mockServer.password,
        port: 443,
      });
    });

    it('should handle vmware service errors', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockRejectedValue(new Error('VMware API error'));

      await expect(
        useCase.execute('server-1', 'vm-123', 'host-2'),
      ).rejects.toThrow('VMware API error');
    });

    it('should throw NotFoundException with correct message', async () => {
      const serverId = 'non-existent';
      serverRepository.findOne.mockResolvedValue(null);

      await expect(
        useCase.execute(serverId, 'vm-123', 'host-2'),
      ).rejects.toThrow(`Server with ID ${serverId} not found`);
    });

    it('should handle different VM and host MOIDs', async () => {
      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockResolvedValue(mockMigrationResult);

      const vmMoid = 'vm-456';
      const destinationMoid = 'host-789';

      await useCase.execute('server-1', vmMoid, destinationMoid);

      expect(vmwareService.migrateVM).toHaveBeenCalledWith(
        vmMoid,
        destinationMoid,
        expect.any(Object),
      );
    });

    it('should handle migration with different success messages', async () => {
      const customResult: VmMigrationResult = {
        success: true,
        message: 'VM migrated with warnings: Non-critical issues detected',
        newHost: 'esxi-host-3',
      };

      serverRepository.findOne.mockResolvedValue(mockServer);
      vmwareService.migrateVM.mockResolvedValue(customResult);

      const result = await useCase.execute('server-1', 'vm-123', 'host-3');

      expect(result).toEqual(customResult);
      expect(result.message).toContain('warnings');
    });
  });
});
