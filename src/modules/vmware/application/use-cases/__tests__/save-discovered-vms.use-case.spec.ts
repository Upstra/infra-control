import { Test, TestingModule } from '@nestjs/testing';
import { SaveDiscoveredVmsUseCase } from '../save-discovered-vms.use-case';
import { VmRepositoryInterface } from '../../../../vms/domain/interfaces/vm.repository.interface';
import { VmDomainService } from '../../../../vms/domain/services/vm.domain.service';
import { DiscoveredVmDto } from '../../dto';
import { Vm } from '../../../../vms/domain/entities/vm.entity';

describe('SaveDiscoveredVmsUseCase', () => {
  let useCase: SaveDiscoveredVmsUseCase;
  let vmRepository: jest.Mocked<VmRepositoryInterface>;
  let vmDomainService: jest.Mocked<VmDomainService>;

  const mockVm: Vm = {
    id: 'vm-1',
    name: 'Test VM',
    state: 'poweredOn',
    grace_period_on: 0,
    grace_period_off: 0,
    priority: 100,
    serverId: 'server-1',
    moid: 'vm-123',
    ip: '192.168.1.100',
    guestOs: 'Ubuntu 20.04',
    numCPU: 2,
    esxiHostMoid: 'host-123',
  } as Vm;

  const mockDiscoveredVm: DiscoveredVmDto = {
    moid: 'vm-123',
    name: 'Test VM',
    ip: '192.168.1.100',
    guestOs: 'Ubuntu 20.04',
    powerState: 'poweredOn',
    memoryMB: 4096,
    numCpu: 2,
    serverId: 'server-1',
    serverName: 'Test Server',
    esxiHostMoid: 'host-123',
  };

  beforeEach(async () => {
    const mockVmRepository = {
      findOneByField: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const mockVmDomainService = {
      createVmEntity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveDiscoveredVmsUseCase,
        {
          provide: 'VmRepositoryInterface',
          useValue: mockVmRepository,
        },
        {
          provide: VmDomainService,
          useValue: mockVmDomainService,
        },
      ],
    }).compile();

    useCase = module.get<SaveDiscoveredVmsUseCase>(SaveDiscoveredVmsUseCase);
    vmRepository = module.get('VmRepositoryInterface');
    vmDomainService = module.get(VmDomainService);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should save new VMs successfully', async () => {
      vmRepository.findOneByField.mockResolvedValue(null);
      vmRepository.findAll.mockResolvedValue([]);
      vmRepository.findOne.mockResolvedValue(null);
      vmDomainService.createVmEntity.mockReturnValue(mockVm);
      vmRepository.save.mockResolvedValue(mockVm);

      const result = await useCase.execute({ vms: [mockDiscoveredVm] });

      expect(result.savedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.savedVms).toHaveLength(1);
      expect(result.savedVms[0]).toEqual(mockVm);
      expect(result.errors).toHaveLength(0);

      expect(vmRepository.findOne).toHaveBeenCalledWith({
        where: {
          moid: mockDiscoveredVm.moid,
        },
      });
      expect(vmDomainService.createVmEntity).toHaveBeenCalledWith({
        name: mockDiscoveredVm.name,
        state: mockDiscoveredVm.powerState,
        grace_period_on: 0,
        grace_period_off: 0,
        priority: 1,
        serverId: mockDiscoveredVm.serverId,
        moid: mockDiscoveredVm.moid,
        ip: mockDiscoveredVm.ip,
        guestOs: mockDiscoveredVm.guestOs,
        numCPU: mockDiscoveredVm.numCpu,
        esxiHostMoid: mockDiscoveredVm.esxiHostMoid,
      });
      expect(vmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockDiscoveredVm.name,
          state: mockDiscoveredVm.powerState,
          serverId: mockDiscoveredVm.serverId,
          moid: mockDiscoveredVm.moid,
          ip: mockDiscoveredVm.ip,
          guestOs: mockDiscoveredVm.guestOs,
          numCPU: mockDiscoveredVm.numCpu,
          esxiHostMoid: mockDiscoveredVm.esxiHostMoid,
        }),
      );
    });

    it('should skip existing VMs with no changes', async () => {
      const existingVmWithSameValues = {
        ...mockVm,
        name: mockDiscoveredVm.name,
        state: mockDiscoveredVm.powerState,
        ip: mockDiscoveredVm.ip,
        guestOs: mockDiscoveredVm.guestOs,
        numCPU: mockDiscoveredVm.numCpu,
        esxiHostMoid: mockDiscoveredVm.esxiHostMoid,
      } as Vm;

      vmRepository.findOneByField.mockResolvedValue(existingVmWithSameValues);
      vmRepository.findAll.mockResolvedValue([]);
      vmRepository.findOne.mockResolvedValue(existingVmWithSameValues);

      const result = await useCase.execute({ vms: [mockDiscoveredVm] });

      expect(result.savedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.savedVms).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      expect(vmRepository.findOne).toHaveBeenCalledWith({
        where: {
          moid: mockDiscoveredVm.moid,
        },
      });
      expect(vmDomainService.createVmEntity).not.toHaveBeenCalled();
      expect(vmRepository.save).not.toHaveBeenCalled();
    });

    it('should update VM when migrated to different server', async () => {
      const existingVm = {
        ...mockVm,
        serverId: 'server-1',
        esxiHostMoid: 'host-123',
      } as Vm;

      const migratedVm: DiscoveredVmDto = {
        ...mockDiscoveredVm,
        serverId: 'server-2',
        esxiHostMoid: 'host-456',
      };

      vmRepository.findOne.mockResolvedValue(existingVm);
      vmRepository.findAll.mockResolvedValue([existingVm]);
      vmRepository.save.mockImplementation(async (vm) => vm as Vm);

      const result = await useCase.execute({ vms: [migratedVm] });

      expect(result.savedCount).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.changes).toBe(1);
      expect(result.failedCount).toBe(0);

      expect(vmRepository.findOne).toHaveBeenCalledWith({
        where: {
          moid: migratedVm.moid,
        },
      });

      expect(vmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server-2',
          esxiHostMoid: 'host-456',
        }),
      );
    });

    it('should detect multiple changes including server migration', async () => {
      const existingVm = {
        ...mockVm,
        serverId: 'server-1',
        esxiHostMoid: 'host-123',
        name: 'Old Name',
        state: 'poweredOff',
      } as Vm;

      const migratedVm: DiscoveredVmDto = {
        ...mockDiscoveredVm,
        serverId: 'server-2',
        esxiHostMoid: 'host-456',
        name: 'New Name',
        powerState: 'poweredOn',
      };

      vmRepository.findOne.mockResolvedValue(existingVm);
      vmRepository.findAll.mockResolvedValue([existingVm]);
      vmRepository.save.mockImplementation(async (vm) => vm as Vm);

      const result = await useCase.execute({ vms: [migratedVm] });

      expect(result.savedCount).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.changes).toBe(1);

      expect(vmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server-2',
          esxiHostMoid: 'host-456',
          name: 'New Name',
          state: 'poweredOn',
        }),
      );
    });

    it('should handle VMs without optional fields', async () => {
      const minimalDiscoveredVm: DiscoveredVmDto = {
        moid: 'vm-456',
        name: 'Minimal VM',
        serverId: 'server-2',
        serverName: 'Server 2',
      };

      vmRepository.findOneByField.mockResolvedValue(null);
      vmRepository.findAll.mockResolvedValue([]);
      vmRepository.findOne.mockResolvedValue(null);
      vmDomainService.createVmEntity.mockReturnValue({
        ...mockVm,
        id: 'vm-2',
        name: 'Minimal VM',
        moid: 'vm-456',
        state: 'unknown',
      } as Vm);
      vmRepository.save.mockResolvedValue({
        ...mockVm,
        id: 'vm-2',
        name: 'Minimal VM',
        moid: 'vm-456',
        state: 'unknown',
      } as Vm);

      const result = await useCase.execute({ vms: [minimalDiscoveredVm] });

      expect(result.savedCount).toBe(1);
      expect(result.failedCount).toBe(0);

      expect(vmDomainService.createVmEntity).toHaveBeenCalledWith({
        name: 'Minimal VM',
        state: 'unknown',
        grace_period_on: 0,
        grace_period_off: 0,
        priority: 1,
        serverId: 'server-2',
        moid: 'vm-456',
        ip: undefined,
        guestOs: undefined,
        numCPU: undefined,
        esxiHostMoid: undefined,
      });
    });

    it('should handle save errors gracefully', async () => {
      const errorMessage = 'Database error';
      vmRepository.findOneByField.mockResolvedValue(null);
      vmRepository.findAll.mockResolvedValue([]);
      vmRepository.findOne.mockResolvedValue(null);
      vmDomainService.createVmEntity.mockReturnValue(mockVm);
      vmRepository.save.mockRejectedValue(new Error(errorMessage));

      const result = await useCase.execute({ vms: [mockDiscoveredVm] });

      expect(result.savedCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.savedVms).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        vm: mockDiscoveredVm.name,
        error: errorMessage,
      });
    });

    it('should process multiple VMs with mixed results', async () => {
      const vm1: DiscoveredVmDto = {
        ...mockDiscoveredVm,
        moid: 'vm-1',
        name: 'VM 1',
      };
      const vm2: DiscoveredVmDto = {
        ...mockDiscoveredVm,
        moid: 'vm-2',
        name: 'VM 2',
      };
      const vm3: DiscoveredVmDto = {
        ...mockDiscoveredVm,
        moid: 'vm-3',
        name: 'VM 3',
      };

      const existingVm2WithSameValues = {
        ...mockVm,
        id: 'vm-2',
        name: 'VM 2',
        state: vm2.powerState,
        ip: vm2.ip,
        guestOs: vm2.guestOs,
        numCPU: vm2.numCpu,
        esxiHostMoid: vm2.esxiHostMoid,
      } as Vm;

      vmRepository.findOneByField
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingVm2WithSameValues)
        .mockResolvedValueOnce(null);
      vmRepository.findAll.mockResolvedValue([]);
      vmRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingVm2WithSameValues)
        .mockResolvedValueOnce(null);

      vmDomainService.createVmEntity
        .mockReturnValueOnce({ ...mockVm, id: 'vm-1', name: 'VM 1' } as Vm)
        .mockReturnValueOnce({ ...mockVm, id: 'vm-3', name: 'VM 3' } as Vm);

      vmRepository.save
        .mockResolvedValueOnce({ ...mockVm, id: 'vm-1', name: 'VM 1' } as Vm)
        .mockRejectedValueOnce(new Error('Save failed'));

      const result = await useCase.execute({ vms: [vm1, vm2, vm3] });

      expect(result.savedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.savedVms).toHaveLength(1);
      expect(result.savedVms[0].name).toBe('VM 1');
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        vm: 'VM 3',
        error: 'Save failed',
      });
    });

    it('should handle empty input array', async () => {
      const result = await useCase.execute({ vms: [] });

      expect(result.savedCount).toBe(0);
      expect(result.failedCount).toBe(0);
      expect(result.savedVms).toHaveLength(0);
      expect(result.errors).toHaveLength(0);

      expect(vmRepository.findOneByField).not.toHaveBeenCalled();
      expect(vmDomainService.createVmEntity).not.toHaveBeenCalled();
      expect(vmRepository.save).not.toHaveBeenCalled();
    });
  });
});
