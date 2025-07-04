import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreviewGroupShutdownUseCase } from '../preview-group-shutdown.use-case';
import { GroupRepository } from '../../../infrastructure/repositories/group.repository';
import { Group } from '../../../domain/entities/group.entity';
import { GroupType } from '../../../domain/enums/group-type.enum';
import { Vm } from '../../../../vms/domain/entities/vm.entity';
import { Server } from '../../../../servers/domain/entities/server.entity';

describe('PreviewGroupShutdownUseCase', () => {
  let useCase: PreviewGroupShutdownUseCase;
  let groupRepository: jest.Mocked<GroupRepository>;
  let vmRepository: jest.Mocked<Repository<Vm>>;
  let serverRepository: jest.Mocked<Repository<Server>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreviewGroupShutdownUseCase,
        {
          provide: GroupRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Vm),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Server),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<PreviewGroupShutdownUseCase>(
      PreviewGroupShutdownUseCase,
    );
    groupRepository = module.get(GroupRepository);
    vmRepository = module.get(getRepositoryToken(Vm));
    serverRepository = module.get(getRepositoryToken(Server));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const groupId = 'test-group-id';

    it('should throw NotFoundException when group does not exist', async () => {
      groupRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(groupId)).rejects.toThrow(
        new NotFoundException(`Group with id "${groupId}" not found`),
      );

      expect(groupRepository.findById).toHaveBeenCalledWith(groupId);
    });

    describe('VM Group Preview', () => {
      const mockGroup = Object.assign(new Group(), {
        id: groupId,
        name: 'Test VM Group',
        type: GroupType.VM,
      });

      beforeEach(() => {
        groupRepository.findById.mockResolvedValue(mockGroup);
      });

      it('should return preview for VM group with resources', async () => {
        const mockVms = [
          Object.assign(new Vm(), {
            id: 'vm2',
            name: 'VM-2',
            priority: 1,
            state: 'stopped',
            groupId,
          }),
          Object.assign(new Vm(), {
            id: 'vm3',
            name: 'VM-3',
            priority: 2,
            state: 'running',
            groupId,
          }),
          Object.assign(new Vm(), {
            id: 'vm1',
            name: 'VM-1',
            priority: 3,
            state: 'running',
            groupId,
          }),
        ];

        vmRepository.find.mockResolvedValue(mockVms);

        const result = await useCase.execute(groupId);

        expect(vmRepository.find).toHaveBeenCalledWith({
          where: { groupId },
          order: { priority: 'ASC' },
        });

        expect(result).toEqual({
          groupId: mockGroup.id,
          groupName: mockGroup.name,
          groupType: GroupType.VM,
          totalResources: 3,
          estimatedDuration: 90,
          resources: [
            {
              id: 'vm2',
              name: 'VM-2',
              priority: 1,
              state: 'stopped',
              shutdownOrder: 1,
            },
            {
              id: 'vm3',
              name: 'VM-3',
              priority: 2,
              state: 'running',
              shutdownOrder: 2,
            },
            {
              id: 'vm1',
              name: 'VM-1',
              priority: 3,
              state: 'running',
              shutdownOrder: 3,
            },
          ],
        });
      });

      it('should handle empty VM group', async () => {
        vmRepository.find.mockResolvedValue([]);

        const result = await useCase.execute(groupId);

        expect(result).toEqual({
          groupId: mockGroup.id,
          groupName: mockGroup.name,
          groupType: GroupType.VM,
          totalResources: 0,
          estimatedDuration: 0,
          resources: [],
        });
      });

      it('should order VMs by priority correctly', async () => {
        const mockVms = [
          Object.assign(new Vm(), {
            id: 'vm2',
            name: 'Low Priority',
            priority: 1,
            state: 'running',
            groupId,
          }),
          Object.assign(new Vm(), {
            id: 'vm3',
            name: 'Medium Priority',
            priority: 5,
            state: 'running',
            groupId,
          }),
          Object.assign(new Vm(), {
            id: 'vm1',
            name: 'High Priority',
            priority: 10,
            state: 'running',
            groupId,
          }),
        ];

        vmRepository.find.mockResolvedValue(mockVms);

        const result = await useCase.execute(groupId);

        expect(result.resources[0].name).toBe('Low Priority');
        expect(result.resources[1].name).toBe('Medium Priority');
        expect(result.resources[2].name).toBe('High Priority');
      });
    });

    describe('Server Group Preview', () => {
      const mockGroup = Object.assign(new Group(), {
        id: groupId,
        name: 'Test Server Group',
        type: GroupType.SERVER,
      });

      beforeEach(() => {
        groupRepository.findById.mockResolvedValue(mockGroup);
      });

      it('should return preview for server group with resources', async () => {
        const mockServers = [
          Object.assign(new Server(), {
            id: 's2',
            name: 'Server-2',
            priority: 1,
            state: 'stopped',
            groupId,
          }),
          Object.assign(new Server(), {
            id: 's1',
            name: 'Server-1',
            priority: 2,
            state: 'running',
            groupId,
          }),
        ];

        serverRepository.find.mockResolvedValue(mockServers);

        const result = await useCase.execute(groupId);

        expect(serverRepository.find).toHaveBeenCalledWith({
          where: { groupId },
          order: { priority: 'ASC' },
        });

        expect(result).toEqual({
          groupId: mockGroup.id,
          groupName: mockGroup.name,
          groupType: GroupType.SERVER,
          totalResources: 2,
          estimatedDuration: 60,
          resources: [
            {
              id: 's2',
              name: 'Server-2',
              priority: 1,
              state: 'stopped',
              shutdownOrder: 1,
            },
            {
              id: 's1',
              name: 'Server-1',
              priority: 2,
              state: 'running',
              shutdownOrder: 2,
            },
          ],
        });
      });

      it('should handle empty server group', async () => {
        serverRepository.find.mockResolvedValue([]);

        const result = await useCase.execute(groupId);

        expect(result).toEqual({
          groupId: mockGroup.id,
          groupName: mockGroup.name,
          groupType: GroupType.SERVER,
          totalResources: 0,
          estimatedDuration: 0,
          resources: [],
        });
      });

      it('should handle servers with same priority', async () => {
        const mockServers = [
          Object.assign(new Server(), {
            id: 's1',
            name: 'Server-A',
            priority: 1,
            state: 'running',
            groupId,
          }),
          Object.assign(new Server(), {
            id: 's2',
            name: 'Server-B',
            priority: 1,
            state: 'running',
            groupId,
          }),
          Object.assign(new Server(), {
            id: 's3',
            name: 'Server-C',
            priority: 2,
            state: 'running',
            groupId,
          }),
        ];

        serverRepository.find.mockResolvedValue(mockServers);

        const result = await useCase.execute(groupId);

        expect(result.resources).toHaveLength(3);
        expect(result.resources[0].priority).toBe(1);
        expect(result.resources[1].priority).toBe(1);
        expect(result.resources[2].priority).toBe(2);
        expect(result.resources[0].shutdownOrder).toBe(1);
        expect(result.resources[1].shutdownOrder).toBe(2);
        expect(result.resources[2].shutdownOrder).toBe(3);
      });
    });

    describe('calculateEstimatedDuration', () => {
      it('should calculate duration based on resource count', async () => {
        const mockGroup = Object.assign(new Group(), {
          id: groupId,
          name: 'Test Group',
          type: GroupType.VM,
        });

        const mockVms = Array.from({ length: 5 }, (_, i) =>
          Object.assign(new Vm(), {
            id: `vm${i}`,
            name: `VM-${i}`,
            priority: i,
            state: 'running',
            groupId,
          }),
        );

        groupRepository.findById.mockResolvedValue(mockGroup);
        vmRepository.find.mockResolvedValue(mockVms);

        const result = await useCase.execute(groupId);

        expect(result.estimatedDuration).toBe(150);
      });

      it('should return 0 duration for empty group', async () => {
        const mockGroup = Object.assign(new Group(), {
          id: groupId,
          name: 'Empty Group',
          type: GroupType.SERVER,
        });

        groupRepository.findById.mockResolvedValue(mockGroup);
        serverRepository.find.mockResolvedValue([]);

        const result = await useCase.execute(groupId);

        expect(result.estimatedDuration).toBe(0);
      });
    });

    it('should handle repository errors', async () => {
      const mockGroup = Object.assign(new Group(), {
        id: groupId,
        name: 'Test Group',
        type: GroupType.VM,
      });

      groupRepository.findById.mockResolvedValue(mockGroup);
      vmRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(groupId)).rejects.toThrow('Database error');
    });
  });
});
