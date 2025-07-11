import { ListVmsUseCase } from '../list-vms.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { Repository } from 'typeorm';

describe('ListVmsUseCase', () => {
  let useCase: ListVmsUseCase;
  let mockVmwareService: any;
  let mockServerRepository: jest.Mocked<Repository<any>>;

  const mockServer = {
    id: 'server-1',
    ip: '192.168.1.10',
    login: 'admin',
    password: 'password123',
  };

  beforeEach(() => {
    mockVmwareService = {
      listVMs: jest.fn(),
      getVMMetrics: jest.fn(),
      controlVMPower: jest.fn(),
      migrateVM: jest.fn(),
      getHostMetrics: jest.fn(),
    };

    mockServerRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<any>>;

    useCase = new ListVmsUseCase(
      mockVmwareService,
      mockServerRepository,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should list VMs from the specified server', async () => {
    const mockVMs = [
      {
        moid: 'vm-123',
        name: 'Test VM 1',
        powerState: 'poweredOn' as const,
        guestOS: 'Ubuntu Linux (64-bit)',
      },
      {
        moid: 'vm-456',
        name: 'Test VM 2',
        powerState: 'poweredOff' as const,
        guestOS: 'Windows Server 2019',
      },
    ];

    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.listVMs.mockResolvedValue(mockVMs);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({ vms: mockVMs });
    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-1' },
    });
    expect(mockVmwareService.listVMs).toHaveBeenCalledWith({
      host: mockServer.ip,
      user: mockServer.login,
      password: mockServer.password,
      port: 443,
    });
  });

  it('should return empty array when no VMs exist', async () => {
    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.listVMs.mockResolvedValue([]);

    const result = await useCase.execute('server-1');

    expect(result).toEqual({ vms: [] });
    expect(mockVmwareService.listVMs).toHaveBeenCalled();
  });

  it('should throw error when server is not found', async () => {
    mockServerRepository.findOne.mockResolvedValue(null);

    await expect(useCase.execute('server-999')).rejects.toThrow(
      'Server with ID server-999 not found',
    );

    expect(mockServerRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'server-999' },
    });
    expect(mockVmwareService.listVMs).not.toHaveBeenCalled();
  });

  it('should handle VMware service errors', async () => {
    const error = new Error('Failed to connect to VMware server');
    mockServerRepository.findOne.mockResolvedValue(mockServer);
    mockVmwareService.listVMs.mockRejectedValue(error);

    await expect(useCase.execute('server-1')).rejects.toThrow(error);

    expect(mockVmwareService.listVMs).toHaveBeenCalledWith({
      host: mockServer.ip,
      user: mockServer.login,
      password: mockServer.password,
      port: 443,
    });
  });
});
