import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SwapVmPrioritiesUseCase } from '../swap-vm-priorities.use-case';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { LogHistoryUseCase } from '../../../../history/application/use-cases';
import { GenerateMigrationPlanUseCase } from '../generate-migration-plan.use-case';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('SwapVmPrioritiesUseCase', () => {
  let useCase: SwapVmPrioritiesUseCase;
  let logHistory: jest.Mocked<LogHistoryUseCase>;
  let generateMigrationPlan: jest.Mocked<GenerateMigrationPlanUseCase>;
  let dataSource: jest.Mocked<DataSource>;
  let entityManager: jest.Mocked<EntityManager>;
  let transactionalRepository: jest.Mocked<Repository<Vm>>;

  const mockUserId = 'user-123';
  const vm1Id = 'vm-1';
  const vm2Id = 'vm-2';

  const mockServer1 = {
    id: 'server-1',
    name: 'Server 1',
    type: 'esxi',
  } as Server;

  const mockServer2 = {
    id: 'server-2',
    name: 'Server 2',
    type: 'esxi',
  } as Server;

  const mockVcenterServer = {
    id: 'server-vcenter',
    name: 'vCenter Server',
    type: 'vcenter',
  } as Server;

  const mockVm1 = {
    id: vm1Id,
    name: 'VM 1',
    priority: 1,
    serverId: 'server-1',
    server: mockServer1,
  } as Vm;

  const mockVm2 = {
    id: vm2Id,
    name: 'VM 2',
    priority: 2,
    serverId: 'server-1',
    server: mockServer1,
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
          provide: LogHistoryUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GenerateMigrationPlanUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    useCase = module.get<SwapVmPrioritiesUseCase>(SwapVmPrioritiesUseCase);
    logHistory = module.get(LogHistoryUseCase);
    generateMigrationPlan = module.get(GenerateMigrationPlanUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    beforeEach(() => {
      dataSource.transaction.mockImplementation(
        async (runInTransaction: any) => {
          return runInTransaction(entityManager);
        },
      );
    });

    it('should successfully swap priorities between two VMs', async () => {
      const vm1Mock = { ...mockVm1 };
      const vm2Mock = { ...mockVm2 };

      transactionalRepository.findOne
        .mockResolvedValueOnce(vm1Mock as Vm)
        .mockResolvedValueOnce(vm2Mock as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(transactionalRepository.findOne).toHaveBeenCalledWith({
        where: { id: vm1Id },
        relations: ['server'],
      });
      expect(transactionalRepository.findOne).toHaveBeenCalledWith({
        where: { id: vm2Id },
        relations: ['server'],
      });
      expect(transactionalRepository.save).toHaveBeenCalledWith([
        expect.objectContaining({ id: vm1Id, priority: 2 }),
        expect.objectContaining({ id: vm2Id, priority: 1 }),
      ]);
      expect(logHistory.execute).toHaveBeenCalledWith(
        'vm',
        `${vm1Id}-${vm2Id}`,
        'SWAP_PRIORITY',
        mockUserId,
      );
      expect(generateMigrationPlan.execute).toHaveBeenCalled();
      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 2 },
        vm2: { id: vm2Id, priority: 1 },
      });
    });

    it('should throw NotFoundException when vm1 does not exist', async () => {
      transactionalRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockVm2 as Vm);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new NotFoundException(`VM with id ${vm1Id} not found`),
      );

      expect(transactionalRepository.findOne).toHaveBeenCalledTimes(2);
      expect(transactionalRepository.save).not.toHaveBeenCalled();
      expect(logHistory.execute).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when vm2 does not exist', async () => {
      transactionalRepository.findOne
        .mockResolvedValueOnce(mockVm1 as Vm)
        .mockResolvedValueOnce(null);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new NotFoundException(`VM with id ${vm2Id} not found`),
      );

      expect(transactionalRepository.findOne).toHaveBeenCalledTimes(2);
      expect(transactionalRepository.save).not.toHaveBeenCalled();
      expect(logHistory.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when vm1 is on vCenter server', async () => {
      const vmOnVcenter = { ...mockVm1, server: mockVcenterServer };

      transactionalRepository.findOne
        .mockResolvedValueOnce(vmOnVcenter as Vm)
        .mockResolvedValueOnce(mockVm2 as Vm);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new BadRequestException(
          'Cannot swap priorities for VMs on vCenter servers',
        ),
      );

      expect(transactionalRepository.save).not.toHaveBeenCalled();
      expect(logHistory.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when vm2 is on vCenter server', async () => {
      const vmOnVcenter = { ...mockVm2, server: mockVcenterServer };

      transactionalRepository.findOne
        .mockResolvedValueOnce(mockVm1 as Vm)
        .mockResolvedValueOnce(vmOnVcenter as Vm);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new BadRequestException(
          'Cannot swap priorities for VMs on vCenter servers',
        ),
      );

      expect(transactionalRepository.save).not.toHaveBeenCalled();
      expect(logHistory.execute).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when VMs are on different servers', async () => {
      const vm1DifferentServer = { ...mockVm1, serverId: 'server-1' };
      const vm2DifferentServer = { ...mockVm2, serverId: 'server-2' };

      transactionalRepository.findOne
        .mockResolvedValueOnce(vm1DifferentServer as Vm)
        .mockResolvedValueOnce(vm2DifferentServer as Vm);

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        new BadRequestException(
          'Cannot swap priorities between VMs on different servers',
        ),
      );

      expect(transactionalRepository.save).not.toHaveBeenCalled();
      expect(logHistory.execute).not.toHaveBeenCalled();
    });

    it('should handle swapping VMs with same priority', async () => {
      const samePriorityVm1 = { ...mockVm1, priority: 5 };
      const samePriorityVm2 = { ...mockVm2, priority: 5 };

      transactionalRepository.findOne
        .mockResolvedValueOnce(samePriorityVm1 as Vm)
        .mockResolvedValueOnce(samePriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 5 },
        vm2: { id: vm2Id, priority: 5 },
      });
    });

    it('should handle null priorities correctly', async () => {
      const nullPriorityVm1 = { ...mockVm1, priority: null } as any;
      const nullPriorityVm2 = { ...mockVm2, priority: null } as any;

      transactionalRepository.findOne
        .mockResolvedValueOnce(nullPriorityVm1 as Vm)
        .mockResolvedValueOnce(nullPriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: null },
        vm2: { id: vm2Id, priority: null },
      });
    });

    it('should handle VMs with no server relation', async () => {
      const vmWithoutServer1 = { ...mockVm1, server: null };
      const vmWithoutServer2 = { ...mockVm2, server: null };

      transactionalRepository.findOne
        .mockResolvedValueOnce(vmWithoutServer1 as Vm)
        .mockResolvedValueOnce(vmWithoutServer2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 2 },
        vm2: { id: vm2Id, priority: 1 },
      });
    });

    it('should rollback transaction on save error', async () => {
      transactionalRepository.findOne
        .mockResolvedValueOnce(mockVm1 as Vm)
        .mockResolvedValueOnce(mockVm2 as Vm);
      transactionalRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        'Database error',
      );

      expect(logHistory.execute).not.toHaveBeenCalled();
      expect(generateMigrationPlan.execute).not.toHaveBeenCalled();
    });

    it('should rollback transaction on logHistory error', async () => {
      transactionalRepository.findOne
        .mockResolvedValueOnce(mockVm1 as Vm)
        .mockResolvedValueOnce(mockVm2 as Vm);
      transactionalRepository.save.mockResolvedValue([mockVm1, mockVm2] as any);
      logHistory.execute.mockRejectedValue(new Error('Log error'));

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        'Log error',
      );

      expect(generateMigrationPlan.execute).not.toHaveBeenCalled();
    });

    it('should rollback transaction on generateMigrationPlan error', async () => {
      transactionalRepository.findOne
        .mockResolvedValueOnce(mockVm1 as Vm)
        .mockResolvedValueOnce(mockVm2 as Vm);
      transactionalRepository.save.mockResolvedValue([mockVm1, mockVm2] as any);
      logHistory.execute.mockResolvedValue(undefined);
      generateMigrationPlan.execute.mockRejectedValue(
        new Error('Migration plan error'),
      );

      await expect(useCase.execute(vm1Id, vm2Id, mockUserId)).rejects.toThrow(
        'Migration plan error',
      );
    });

    it('should handle very large priority values', async () => {
      const largePriorityVm1 = { ...mockVm1, priority: Number.MAX_SAFE_INTEGER };
      const largePriorityVm2 = { ...mockVm2, priority: 1 };

      transactionalRepository.findOne
        .mockResolvedValueOnce(largePriorityVm1 as Vm)
        .mockResolvedValueOnce(largePriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 1 },
        vm2: { id: vm2Id, priority: Number.MAX_SAFE_INTEGER },
      });
    });

    it('should handle negative priority values', async () => {
      const negativePriorityVm1 = { ...mockVm1, priority: -10 };
      const negativePriorityVm2 = { ...mockVm2, priority: -5 };

      transactionalRepository.findOne
        .mockResolvedValueOnce(negativePriorityVm1 as Vm)
        .mockResolvedValueOnce(negativePriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: -5 },
        vm2: { id: vm2Id, priority: -10 },
      });
    });

    it('should handle zero priority values', async () => {
      const zeroPriorityVm1 = { ...mockVm1, priority: 0 };
      const zeroPriorityVm2 = { ...mockVm2, priority: 10 };

      transactionalRepository.findOne
        .mockResolvedValueOnce(zeroPriorityVm1 as Vm)
        .mockResolvedValueOnce(zeroPriorityVm2 as Vm);
      transactionalRepository.save.mockImplementation(async (entities) => {
        return entities as any;
      });

      const result = await useCase.execute(vm1Id, vm2Id, mockUserId);

      expect(result).toEqual({
        vm1: { id: vm1Id, priority: 10 },
        vm2: { id: vm2Id, priority: 0 },
      });
    });
  });
});