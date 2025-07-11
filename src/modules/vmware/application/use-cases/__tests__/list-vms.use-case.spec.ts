import { Test, TestingModule } from '@nestjs/testing';
import { ListVmsUseCase } from '../list-vms.use-case';
import { VmwareService } from '@/modules/vmware/domain/services/vmware.service';
import { VmwareConnectionDto } from '@/modules/vmware/application/dto';
import { VmwareVm } from '@/modules/vmware/domain/interfaces';

describe('ListVmsUseCase', () => {
  let useCase: ListVmsUseCase;
  let vmwareService: jest.Mocked<VmwareService>;

  const mockConnection: VmwareConnectionDto = {
    host: '192.168.1.10',
    user: 'admin',
    password: 'password123',
  };

  const mockVms: VmwareVm[] = [
    {
      moid: 'vm-123',
      name: 'Test VM 1',
      powerState: 'poweredOn',
      guestOS: 'Ubuntu Linux (64-bit)',
      ipAddress: '192.168.1.100',
    },
    {
      moid: 'vm-124',
      name: 'Test VM 2',
      powerState: 'poweredOff',
      guestOS: 'Windows Server 2019',
      ipAddress: '192.168.1.101',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListVmsUseCase,
        {
          provide: VmwareService,
          useValue: {
            listVMs: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<ListVmsUseCase>(ListVmsUseCase);
    vmwareService = module.get(VmwareService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return list of VMs', async () => {
    vmwareService.listVMs.mockResolvedValue(mockVms);

    const result = await useCase.execute(mockConnection);

    expect(result).toEqual({ vms: mockVms });
    expect(vmwareService.listVMs).toHaveBeenCalledWith(mockConnection);
    expect(vmwareService.listVMs).toHaveBeenCalledTimes(1);
  });

  it('should return empty list when no VMs', async () => {
    vmwareService.listVMs.mockResolvedValue([]);

    const result = await useCase.execute(mockConnection);

    expect(result).toEqual({ vms: [] });
    expect(vmwareService.listVMs).toHaveBeenCalledWith(mockConnection);
  });

  it('should propagate errors from service', async () => {
    const error = new Error('Connection failed');
    vmwareService.listVMs.mockRejectedValue(error);

    await expect(useCase.execute(mockConnection)).rejects.toThrow(error);
    expect(vmwareService.listVMs).toHaveBeenCalledWith(mockConnection);
  });
});