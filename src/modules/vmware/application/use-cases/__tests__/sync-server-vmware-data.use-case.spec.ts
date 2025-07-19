import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SyncServerVmwareDataUseCase } from '../sync-server-vmware-data.use-case';
import { VmwareService } from '../../../domain/services/vmware.service';
import { Server } from '@/modules/servers/domain/entities/server.entity';
import { VmwareConnectionDto } from '../../dto';
import { VmwareServer } from '../../../domain/interfaces';

describe('SyncServerVmwareDataUseCase', () => {
  let useCase: SyncServerVmwareDataUseCase;
  let vmwareService: jest.Mocked<VmwareService>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  const mockVmwareServers: VmwareServer[] = [
    {
      moid: 'host-123',
      name: 'ESXi-Host-1',
      vCenterIp: '192.168.1.100',
      cluster: 'Production',
      vendor: 'Dell Inc.',
      model: 'PowerEdge R740',
      ip: '192.168.1.10',
      cpuCores: 32,
      cpuThreads: 64,
      cpuMHz: 2400,
      ramTotal: 268435456,
    },
    {
      moid: 'host-456',
      name: 'ESXi-Host-2',
      vCenterIp: '192.168.1.100',
      cluster: 'Production',
      vendor: 'HP',
      model: 'ProLiant DL380',
      ip: '192.168.1.11',
      cpuCores: 24,
      cpuThreads: 48,
      cpuMHz: 2600,
      ramTotal: 134217728,
    },
  ];

  const mockExistingServers: Server[] = [
    {
      id: 'server-1',
      name: 'Server 1',
      vmwareHostMoid: 'host-123',
      vmwareVCenterIp: '192.168.1.99',
      vmwareCluster: 'Old-Cluster',
      vmwareVendor: 'Dell',
      vmwareModel: 'R730',
      vmwareCpuCores: 16,
      vmwareCpuThreads: 32,
      vmwareCpuMHz: 2200,
      vmwareRamTotal: 134217728,
    } as Server,
    {
      id: 'server-2',
      name: 'Server 2',
      vmwareHostMoid: 'host-789',
      vmwareVCenterIp: null,
      vmwareCluster: null,
      vmwareVendor: null,
      vmwareModel: null,
      vmwareCpuCores: null,
      vmwareCpuThreads: null,
      vmwareCpuMHz: null,
      vmwareRamTotal: null,
    } as Server,
    {
      id: 'server-3',
      name: 'Server 3',
      vmwareHostMoid: 'host-456',
      vmwareVCenterIp: null,
      vmwareCluster: null,
      vmwareVendor: null,
      vmwareModel: null,
      vmwareCpuCores: null,
      vmwareCpuThreads: null,
      vmwareCpuMHz: null,
      vmwareRamTotal: null,
    } as Server,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncServerVmwareDataUseCase,
        {
          provide: VmwareService,
          useValue: {
            listServers: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Server),
          useValue: {
            find: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<SyncServerVmwareDataUseCase>(
      SyncServerVmwareDataUseCase,
    );
    vmwareService = module.get(VmwareService);
    serverRepository = module.get(getRepositoryToken(Server));
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute with VmwareConnectionDto', () => {
    const connectionDto: VmwareConnectionDto = {
      host: '192.168.1.100',
      user: 'admin',
      password: 'password',
      port: 443,
    };

    it('should sync all discovered servers with existing servers', async () => {
      vmwareService.listServers.mockResolvedValue(mockVmwareServers);
      serverRepository.find.mockResolvedValue(mockExistingServers);

      const result = await useCase.execute(connectionDto);

      expect(vmwareService.listServers).toHaveBeenCalledWith(connectionDto);
      expect(serverRepository.find).toHaveBeenCalled();

      expect(serverRepository.update).toHaveBeenCalledWith('server-1', {
        vmwareVCenterIp: '192.168.1.100',
        vmwareCluster: 'Production',
        vmwareVendor: 'Dell Inc.',
        vmwareModel: 'PowerEdge R740',
        vmwareCpuCores: 32,
        vmwareCpuThreads: 64,
        vmwareCpuMHz: 2400,
        vmwareRamTotal: 268435456,
      });

      expect(serverRepository.update).toHaveBeenCalledWith('server-3', {
        vmwareVCenterIp: '192.168.1.100',
        vmwareCluster: 'Production',
        vmwareVendor: 'HP',
        vmwareModel: 'ProLiant DL380',
        vmwareCpuCores: 24,
        vmwareCpuThreads: 48,
        vmwareCpuMHz: 2600,
        vmwareRamTotal: 134217728,
      });

      expect(result).toEqual({
        synchronized: 2,
        discovered: mockVmwareServers,
        notFound: ['Server 2'],
      });
    });

    it('should handle no existing servers', async () => {
      vmwareService.listServers.mockResolvedValue(mockVmwareServers);
      serverRepository.find.mockResolvedValue([]);

      const result = await useCase.execute(connectionDto);

      expect(serverRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        synchronized: 0,
        discovered: mockVmwareServers,
        notFound: [],
      });
    });

    it('should handle no discovered servers', async () => {
      vmwareService.listServers.mockResolvedValue([]);
      serverRepository.find.mockResolvedValue(mockExistingServers);

      const result = await useCase.execute(connectionDto);

      expect(serverRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        synchronized: 0,
        discovered: [],
        notFound: ['Server 1', 'Server 2', 'Server 3'],
      });
    });

    it('should handle partial vmware data and preserve existing values', async () => {
      const partialVmwareServer: VmwareServer = {
        moid: 'host-123',
        name: 'ESXi-Host-1',
        vCenterIp: null,
        cluster: null,
        vendor: 'New Vendor',
        model: null,
        ip: '192.168.1.10',
        cpuCores: null,
        cpuThreads: null,
        cpuMHz: 3000,
        ramTotal: null,
      };

      vmwareService.listServers.mockResolvedValue([partialVmwareServer]);
      serverRepository.find.mockResolvedValue([mockExistingServers[0]]);

      const result = await useCase.execute(connectionDto);

      expect(serverRepository.update).toHaveBeenCalledWith('server-1', {
        vmwareVCenterIp: '192.168.1.99',
        vmwareCluster: 'Old-Cluster',
        vmwareVendor: 'New Vendor',
        vmwareModel: 'R730',
        vmwareCpuCores: 16,
        vmwareCpuThreads: 32,
        vmwareCpuMHz: 3000,
        vmwareRamTotal: 134217728,
      });

      expect(result).toEqual({
        synchronized: 1,
        discovered: [partialVmwareServer],
        notFound: [],
      });
    });

    it('should handle vmware service errors', async () => {
      const error = new Error('VMware connection failed');
      vmwareService.listServers.mockRejectedValue(error);

      await expect(useCase.execute(connectionDto)).rejects.toThrow(
        'VMware connection failed',
      );

      expect(serverRepository.find).not.toHaveBeenCalled();
      expect(serverRepository.update).not.toHaveBeenCalled();
    });

    it('should handle repository find errors', async () => {
      vmwareService.listServers.mockResolvedValue(mockVmwareServers);
      serverRepository.find.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(useCase.execute(connectionDto)).rejects.toThrow(
        'Database connection failed',
      );

      expect(serverRepository.update).not.toHaveBeenCalled();
    });

    it('should continue syncing even if one update fails', async () => {
      vmwareService.listServers.mockResolvedValue(mockVmwareServers);
      serverRepository.find.mockResolvedValue(mockExistingServers);

      serverRepository.update = jest.fn()
        .mockRejectedValueOnce(new Error('Update failed'))
        .mockResolvedValueOnce(undefined);

      await expect(useCase.execute(connectionDto)).rejects.toThrow('Update failed');

      expect(serverRepository.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('execute with serverId and fullSync params', () => {
    it('should return placeholder response for serverId params', async () => {
      const params = { serverId: 'server-123', fullSync: true };

      const result = await useCase.execute(params);

      expect(vmwareService.listServers).not.toHaveBeenCalled();
      expect(serverRepository.find).not.toHaveBeenCalled();
      expect(serverRepository.update).not.toHaveBeenCalled();

      expect(result).toEqual({
        serverId: 'server-123',
        vmsUpdated: 0,
        vmsAdded: 0,
        vmsRemoved: 0,
        errors: [],
      });
    });

    it('should handle params with only serverId', async () => {
      const params = { serverId: 'server-456' };

      const result = await useCase.execute(params);

      expect(result).toEqual({
        serverId: 'server-456',
        vmsUpdated: 0,
        vmsAdded: 0,
        vmsRemoved: 0,
        errors: [],
      });
    });

    it('should handle params with only fullSync', async () => {
      const params = { fullSync: false };

      const result = await useCase.execute(params);

      expect(result).toEqual({
        serverId: undefined,
        vmsUpdated: 0,
        vmsAdded: 0,
        vmsRemoved: 0,
        errors: [],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle servers with null vmwareHostMoid', async () => {
      const serverWithoutMoid = {
        ...mockExistingServers[0],
        vmwareHostMoid: null,
      } as Server;

      vmwareService.listServers.mockResolvedValue(mockVmwareServers);
      serverRepository.find.mockResolvedValue([serverWithoutMoid]);

      const result = await useCase.execute({
        host: '192.168.1.100',
        user: 'admin',
        password: 'password',
        port: 443,
      });

      expect(serverRepository.update).not.toHaveBeenCalled();
      expect(result.notFound).toContain('Server 1');
    });

    it('should handle empty moid in discovered servers', async () => {
      const invalidVmwareServer: VmwareServer = {
        ...mockVmwareServers[0],
        moid: '',
      };

      vmwareService.listServers.mockResolvedValue([invalidVmwareServer]);
      serverRepository.find.mockResolvedValue([mockExistingServers[0]]);

      const result = await useCase.execute({
        host: '192.168.1.100',
        user: 'admin',
        password: 'password',
        port: 443,
      });

      expect(serverRepository.update).not.toHaveBeenCalled();
      expect(result.notFound).toContain('Server 1');
    });

    it('should handle multiple servers with same moid', async () => {
      const duplicateMoidServers = [
        mockExistingServers[0],
        { ...mockExistingServers[1], vmwareHostMoid: 'host-123' } as Server,
      ];

      vmwareService.listServers.mockResolvedValue([mockVmwareServers[0]]);
      serverRepository.find.mockResolvedValue(duplicateMoidServers);

      const result = await useCase.execute({
        host: '192.168.1.100',
        user: 'admin',
        password: 'password',
        port: 443,
      });

      expect(serverRepository.update).toHaveBeenCalledTimes(2);
      expect(result.synchronized).toBe(2);
    });
  });
});