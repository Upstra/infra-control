import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetVmPrioritiesUseCase } from '../get-vm-priorities.use-case';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { GetUserVmPermissionsUseCase } from '../../../../permissions/application/use-cases/permission-vm';
import { PermissionBit } from '../../../../permissions/domain/value-objects/permission-bit.enum';

describe('GetVmPrioritiesUseCase', () => {
  let useCase: GetVmPrioritiesUseCase;
  let vmRepository: jest.Mocked<Repository<Vm>>;
  let getUserPermissionVm: jest.Mocked<GetUserVmPermissionsUseCase>;

  const mockUserId = 'user-123';

  const mockVms = [
    {
      id: 'vm-1',
      name: 'VM Alpha',
      serverId: 'server-1',
      priority: 3,
      state: 'running',
    },
    {
      id: 'vm-2',
      name: 'VM Beta',
      serverId: 'server-1',
      priority: 1,
      state: 'stopped',
    },
    {
      id: 'vm-3',
      name: 'VM Gamma',
      serverId: 'server-2',
      priority: 2,
      state: 'running',
    },
  ] as Vm[];

  const mockPermissions = [
    { vmId: 'vm-1', bitmask: PermissionBit.READ | PermissionBit.WRITE },
    { vmId: 'vm-2', bitmask: PermissionBit.READ },
    { vmId: 'vm-3', bitmask: PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE },
    { vmId: 'vm-4', bitmask: PermissionBit.WRITE }, // No READ permission
  ];

  beforeEach(async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetVmPrioritiesUseCase,
        {
          provide: getRepositoryToken(Vm),
          useValue: {
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
        {
          provide: GetUserVmPermissionsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetVmPrioritiesUseCase>(GetVmPrioritiesUseCase);
    vmRepository = module.get(getRepositoryToken(Vm));
    getUserPermissionVm = module.get(GetUserVmPermissionsUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return VMs with priorities ordered by priority then name', async () => {
      getUserPermissionVm.execute.mockResolvedValue(mockPermissions);
      
      const queryBuilder = vmRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(mockVms);

      const result = await useCase.execute(mockUserId);

      expect(getUserPermissionVm.execute).toHaveBeenCalledWith(mockUserId);
      expect(vmRepository.createQueryBuilder).toHaveBeenCalledWith('vm');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'vm.id IN (:...ids)',
        { ids: ['vm-1', 'vm-2', 'vm-3'] }
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('vm.priority', 'ASC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('vm.name', 'ASC');
      expect(queryBuilder.getMany).toHaveBeenCalled();

      expect(result).toEqual([
        {
          id: 'vm-1',
          name: 'VM Alpha',
          serverId: 'server-1',
          priority: 3,
          state: 'running',
        },
        {
          id: 'vm-2',
          name: 'VM Beta',
          serverId: 'server-1',
          priority: 1,
          state: 'stopped',
        },
        {
          id: 'vm-3',
          name: 'VM Gamma',
          serverId: 'server-2',
          priority: 2,
          state: 'running',
        },
      ]);
    });

    it('should filter VMs by READ permission', async () => {
      const permissionsWithoutRead = [
        { vmId: 'vm-1', bitmask: PermissionBit.WRITE },
        { vmId: 'vm-2', bitmask: PermissionBit.DELETE },
        { vmId: 'vm-3', bitmask: PermissionBit.READ },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissionsWithoutRead);
      
      const queryBuilder = vmRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([mockVms[2]]);

      const result = await useCase.execute(mockUserId);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'vm.id IN (:...ids)',
        { ids: ['vm-3'] }
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('vm-3');
    });

    it('should return empty array when user has no permissions', async () => {
      getUserPermissionVm.execute.mockResolvedValue([]);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([]);
      expect(vmRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no READ permissions', async () => {
      const noReadPermissions = [
        { vmId: 'vm-1', bitmask: PermissionBit.WRITE },
        { vmId: 'vm-2', bitmask: PermissionBit.DELETE },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(noReadPermissions);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([]);
      expect(vmRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should handle VMs with null values correctly', async () => {
      getUserPermissionVm.execute.mockResolvedValue([
        { vmId: 'vm-1', bitmask: PermissionBit.READ },
      ]);
      
      const vmWithNulls = {
        id: 'vm-1',
        name: 'VM Alpha',
        serverId: null,
        priority: null,
        state: null,
      } as any as Vm;
      
      const queryBuilder = vmRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([vmWithNulls]);

      const result = await useCase.execute(mockUserId);

      expect(result).toEqual([
        {
          id: 'vm-1',
          name: 'VM Alpha',
          serverId: null,
          priority: null,
          state: null,
        },
      ]);
    });

    it('should handle permission check with complex bitmasks', async () => {
      const complexPermissions = [
        { vmId: 'vm-1', bitmask: 0 }, // No permissions
        { vmId: 'vm-2', bitmask: PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE | PermissionBit.RESTART },
        { vmId: 'vm-3', bitmask: PermissionBit.READ },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(complexPermissions);
      
      const queryBuilder = vmRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([mockVms[1], mockVms[2]]);

      const result = await useCase.execute(mockUserId);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'vm.id IN (:...ids)',
        { ids: ['vm-2', 'vm-3'] }
      );
      expect(result).toHaveLength(2);
    });

    it('should handle VMs from different servers', async () => {
      const permissions = [
        { vmId: 'vm-1', bitmask: PermissionBit.READ },
        { vmId: 'vm-2', bitmask: PermissionBit.READ },
        { vmId: 'vm-3', bitmask: PermissionBit.READ },
      ];
      
      getUserPermissionVm.execute.mockResolvedValue(permissions);
      
      const vmsFromDifferentServers = [
        { id: 'vm-1', name: 'VM 1', serverId: 'server-a', priority: 1, state: 'running' },
        { id: 'vm-2', name: 'VM 2', serverId: 'server-b', priority: 2, state: 'running' },
        { id: 'vm-3', name: 'VM 3', serverId: 'server-c', priority: 3, state: 'running' },
      ] as Vm[];
      
      const queryBuilder = vmRepository.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(vmsFromDifferentServers);

      const result = await useCase.execute(mockUserId);

      expect(result).toHaveLength(3);
      expect(result.map(vm => vm.serverId)).toEqual(['server-a', 'server-b', 'server-c']);
    });
  });
});