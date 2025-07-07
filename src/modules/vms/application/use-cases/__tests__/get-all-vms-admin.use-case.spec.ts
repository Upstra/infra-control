import { Test, TestingModule } from '@nestjs/testing';
import { GetAllVmsAdminUseCase } from '../get-all-vms-admin.use-case';
import { VmRepositoryInterface } from '@/modules/vms/domain/interfaces/vm.repository.interface';
import { VmResponseDto } from '../../dto/vm.response.dto';
import { Vm } from '@/modules/vms/domain/entities/vm.entity';

describe('GetAllVmsAdminUseCase', () => {
  let useCase: GetAllVmsAdminUseCase;
  let repository: jest.Mocked<VmRepositoryInterface>;

  const mockVm = (overrides: Partial<Vm> = {}): Vm => {
    const vm = new Vm();
    Object.assign(vm, {
      id: 'vm-123',
      name: 'Test VM',
      os: 'Ubuntu 22.04',
      serverId: 'server-123',
      groupId: null,
      priority: 5,
      ip: '192.168.1.10',
      state: 'running',
      ...overrides,
    });
    return vm;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllVmsAdminUseCase,
        {
          provide: 'VmRepositoryInterface',
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetAllVmsAdminUseCase>(GetAllVmsAdminUseCase);
    repository = module.get('VmRepositoryInterface');
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return all VMs without filtering', async () => {
      const vms = [
        mockVm({ id: 'vm-1', name: 'VM 1' }),
        mockVm({ id: 'vm-2', name: 'VM 2' }),
        mockVm({ id: 'vm-3', name: 'VM 3' }),
      ];

      repository.findAll.mockResolvedValue(vms);

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalledWith();
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        vms.map((vm) =>
          expect.objectContaining({
            id: vm.id,
            name: vm.name,
            os: vm.os,
            serverId: vm.serverId,
          }),
        ),
      );
      expect(result[0]).toBeInstanceOf(VmResponseDto);
    });

    it('should return empty array when no VMs exist', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(repository.findAll).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });

    it('should handle large number of VMs', async () => {
      const vms = Array.from({ length: 100 }, (_, i) =>
        mockVm({ id: `vm-${i}`, name: `VM ${i}` }),
      );

      repository.findAll.mockResolvedValue(vms);

      const result = await useCase.execute();

      expect(result).toHaveLength(100);
      expect(result[0]).toBeInstanceOf(VmResponseDto);
      expect(result[99]).toBeInstanceOf(VmResponseDto);
    });

    it('should map all VM properties to response DTOs', async () => {
      const vm = mockVm({
        id: 'vm-test',
        name: 'Test VM',
        os: 'Windows Server 2022',
        serverId: 'server-test',
        groupId: 'group-test',
        priority: 10,
        ip: '10.0.0.100',
        state: 'stopped',
      });

      repository.findAll.mockResolvedValue([vm]);

      const result = await useCase.execute();

      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'vm-test',
          name: 'Test VM',
          os: 'Windows Server 2022',
          serverId: 'server-test',
          groupId: 'group-test',
          priority: 10,
          ip: '10.0.0.100',
          state: 'stopped',
        }),
      );
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      repository.findAll.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow(error);
      expect(repository.findAll).toHaveBeenCalledWith();
    });
  });
});
