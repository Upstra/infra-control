import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SwapVmPrioritiesUseCase } from '../swap-vm-priorities.use-case';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { GetUserVmPermissionsUseCase } from '../../../../permissions/application/use-cases/permission-vm';
import { LogHistoryUseCase } from '../../../../history/application/use-cases';
import { PermissionBit } from '../../../../permissions/domain/value-objects/permission-bit.enum';

describe('SwapVmPrioritiesUseCase', () => {
  let useCase: SwapVmPrioritiesUseCase;
  let vmRepository: jest.Mocked<Repository<Vm>>;
  let getUserPermissionVm: jest.Mocked<GetUserVmPermissionsUseCase>;
  let logHistory: jest.Mocked<LogHistoryUseCase>;
  let dataSource: jest.Mocked<DataSource>;
  let entityManager: jest.Mocked<EntityManager>;
  let transactionalRepository: jest.Mocked<Repository<Vm>>;

  const mockUserId = 'user-123';
  const vm1Id = 'vm-1';
  const vm2Id = 'vm-2';

  const mockVm1 = {
    id: vm1Id,
    name: 'VM 1',
    priority: 1,
  } as Vm;

  const mockVm2 = {
    id: vm2Id,
    name: 'VM 2',
    priority: 2,
  } as Vm;

  beforeEach(async () => {
    transactionalRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;

    entityManager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepository),
    } as any;

    dataSource = {
      transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwapVmPrioritiesUseCase,
        {
          provide: getRepositoryToken(Vm),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GetUserVmPermissionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
            executeStructured: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    useCase = module.get<SwapVmPrioritiesUseCase>(SwapVmPrioritiesUseCase);
    vmRepository = module.get(getRepositoryToken(Vm));
    getUserPermissionVm = module.get(GetUserVmPermissionsUseCase);
    logHistory = module.get(LogHistoryUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(async (runInTransaction: any) => {
        return runInTransaction(entityManager);
      });
    });

    it('should successfully swap priorities between two VMs', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockVm1);
      transactionalRepository.findOne.mockResolvedValueOnce(mockVm2);
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(getUserPermissionVm.execute).toHaveBeenCalledWith(mockUserId);
      expect(transactionalRepository.findOne).toHaveBeenCalledWith({ where: { id: vm1Id } });
      expect(transactionalRepository.findOne).toHaveBeenCalledWith({ where: { id: vm2Id } });
      expect(transactionalRepository.save).toHaveBeenCalledWith([
        { ...mockVm1, priority: 2 },
        { ...mockVm2, priority: 1 },
      ]);
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'vm',
        entityId: vm1Id,
        action: 'PRIORITY_SWAP',
        userId: mockUserId,
        oldValue: { priority: 1 },
        newValue: { priority: 2 },
        metadata: {
          swapPartner: vm2Id,
          swapPartnerName: 'VM 2',
          vmServerId: undefined,
          oldPriority: 1,
          newPriority: 2,
        },
      });
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'vm',
        entityId: vm2Id,
        action: 'PRIORITY_SWAP',
        userId: mockUserId,
        oldValue: { priority: 2 },
        newValue: { priority: 1 },
        metadata: {
          swapPartner: vm1Id,
          swapPartnerName: 'VM 1',
          vmServerId: undefined,
          oldPriority: 2,
          newPriority: 1,
        },
      });
      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 2 },
        vm2: { id: vm2Id, priority: 1 },
      });
    });

    it('should throw ForbiddenException when user lacks WRITE permission on vm1', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ }, // No WRITE
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new ForbiddenException('You do not have write permissions on both VMs')
      );

      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user lacks WRITE permission on vm2', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ }, // No WRITE
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new ForbiddenException('You do not have write permissions on both VMs')
      );
    });

    it('should throw ForbiddenException when user has no permission on vm1', async () => {
      const permissions = [
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new ForbiddenException('You do not have write permissions on both VMs')
      );
    });

    it('should throw ForbiddenException when user has no permissions at all', async () => {
      getUserPermissionVm.execute.mockResolvedValue([]);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new ForbiddenException('You do not have write permissions on both VMs')
      );
    });

    it('should throw NotFoundException when vm1 does not exist', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(null);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new NotFoundException(`VM with id "${vm1Id}" not found`)
      );
    });

    it('should throw NotFoundException when vm2 does not exist', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockVm1);
      transactionalRepository.findOne.mockResolvedValueOnce(null);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new NotFoundException(`VM with id "${vm2Id}" not found`)
      );
    });

    it('should handle swapping VMs with same priority', async () => {
      const samePriorityVm1 = { ...mockVm1, priority: 5 };
      const samePriorityVm2 = { ...mockVm2, priority: 5 };
      
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(samePriorityVm1 as Vm);
      transactionalRepository.findOne.mockResolvedValueOnce(samePriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 5 },
        vm2: { id: vm2Id, priority: 5 },
      });
    });

    it('should handle swapping with complex permission bitmasks', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE | PermissionBit.RESTART | PermissionBit.SHUTDOWN | PermissionBit.SNAPSHOT }, // All permissions
        { vmId: vm2Id, bitmask: PermissionBit.WRITE | PermissionBit.DELETE }, // WRITE + DELETE
      ];
      
      // Create mutable copies that will be mutated by the use case
      const vm1Mock = { ...mockVm1, priority: 1 };
      const vm2Mock = { ...mockVm2, priority: 2 };
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      
      // Return the mocks that will be mutated
      transactionalRepository.findOne
        .mockResolvedValueOnce(vm1Mock as Vm)
        .mockResolvedValueOnce(vm2Mock as Vm);
        
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);
      
      // The mocks should have been mutated
      expect(vm1Mock.priority).toBe(2);
      expect(vm2Mock.priority).toBe(1);
      
      // And the result should reflect the swapped values
      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 2 },
        vm2: { id: vm2Id, priority: 1 },
      });
    });

    it('should handle null priorities correctly', async () => {
      const nullPriorityVm1 = { ...mockVm1, priority: null } as any;
      const nullPriorityVm2 = { ...mockVm2, priority: null } as any;
      
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(nullPriorityVm1 as Vm);
      transactionalRepository.findOne.mockResolvedValueOnce(nullPriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: null },
        vm2: { id: vm2Id, priority: null },
      });
    });

    it('should rollback transaction on error', async () => {
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce(mockVm1);
      transactionalRepository.findOne.mockResolvedValueOnce(mockVm2);
      transactionalRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow('Database error');
      
      // Verify that logHistory was not called since transaction rolled back
      expect(logHistory.executeStructured).not.toHaveBeenCalled();
    });

    it('should handle VMs from different servers', async () => {
      const vm1DifferentServer = { ...mockVm1, serverId: 'server-a' };
      const vm2DifferentServer = { ...mockVm2, serverId: 'server-b' };
      
      const permissions = [
        { vmId: vm1Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
        { vmId: vm2Id, bitmask: PermissionBit.READ | PermissionBit.WRITE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      transactionalRepository.findOne.mockResolvedValueOnce({ ...vm1DifferentServer } as Vm);
      transactionalRepository.findOne.mockResolvedValueOnce({ ...vm2DifferentServer } as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        // TypeORM save returns the saved entities
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 2 },
        vm2: { id: vm2Id, priority: 1 },
      });
      
      expect(logHistory.executeStructured).toHaveBeenCalledWith({
        entity: 'vm',
        entityId: vm1Id,
        action: 'PRIORITY_SWAP',
        userId: mockUserId,
        oldValue: { priority: 1 },
        newValue: { priority: 2 },
        metadata: {
          swapPartner: vm2Id,
          swapPartnerName: 'VM 2',
          vmServerId: 'server-a',
          oldPriority: 1,
          newPriority: 2,
        },
      });
    });
  });
});