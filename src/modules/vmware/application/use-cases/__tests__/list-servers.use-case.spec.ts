import { Test, TestingModule } from '@nestjs/testing';
import { ListServersUseCase } from '../list-servers.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareServer } from '@/modules/vmware/domain/interfaces';
import { VmwareConnectionDto } from '../../dto';

describe('ListServersUseCase', () => {
  let useCase: ListServersUseCase;
  let vmwareService: jest.Mocked<VmwareService>;

  const mockVmwareService = {
    listServers: jest.fn(),
  };

  const mockConnection: VmwareConnectionDto = {
    host: '192.168.1.10',
    user: 'admin',
    password: 'password123',
    port: 443,
  };

  const mockServers: VmwareServer[] = [
    {
      name: 'esxi-server-01',
      vCenterIp: '192.168.1.5',
      cluster: 'Production-Cluster',
      vendor: 'HP',
      model: 'ProLiant DL380 Gen10',
      ip: '192.168.1.10',
      cpuCores: 16,
      cpuThreads: 32,
      cpuMHz: 2400,
      ramTotal: 64,
    },
    {
      name: 'esxi-server-02',
      vCenterIp: '192.168.1.5',
      cluster: 'Production-Cluster',
      vendor: 'Dell Inc.',
      model: 'PowerEdge R740',
      ip: '192.168.1.11',
      cpuCores: 24,
      cpuThreads: 48,
      cpuMHz: 2600,
      ramTotal: 128,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListServersUseCase,
        {
          provide: VmwareService,
          useValue: mockVmwareService,
        },
      ],
    }).compile();

    useCase = module.get<ListServersUseCase>(ListServersUseCase);
    vmwareService = module.get(VmwareService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return list of servers', async () => {
      (vmwareService.listServers as jest.Mock).mockResolvedValue(mockServers);

      const result = await useCase.execute(mockConnection);

      expect(result).toEqual(mockServers);
      expect(vmwareService.listServers).toHaveBeenCalledWith(mockConnection);
      expect(vmwareService.listServers).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from vmware service', async () => {
      const error = new Error('Connection failed');
      (vmwareService.listServers as jest.Mock).mockRejectedValue(error);

      await expect(useCase.execute(mockConnection)).rejects.toThrow(
        'Connection failed',
      );
      expect(vmwareService.listServers).toHaveBeenCalledWith(mockConnection);
    });

    it('should handle empty server list', async () => {
      (vmwareService.listServers as jest.Mock).mockResolvedValue([]);

      const result = await useCase.execute(mockConnection);

      expect(result).toEqual([]);
      expect(vmwareService.listServers).toHaveBeenCalledWith(mockConnection);
    });
  });
});
