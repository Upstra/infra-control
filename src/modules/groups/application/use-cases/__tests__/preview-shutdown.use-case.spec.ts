import { PreviewShutdownUseCase } from '../preview-shutdown.use-case';
import { Repository } from 'typeorm';
import { GroupServer } from '@/modules/groups/domain/entities/group.server.entity';
import { GroupVm } from '@/modules/groups/domain/entities/group.vm.entity';
import { createMockGroupServer } from '@/modules/groups/__mocks__/group.server.mock';
import { createMockGroupVm } from '@/modules/groups/__mocks__/group.vm.mock';
import { createMockServer } from '@/modules/servers/__mocks__/servers.mock';
import { createMockVm } from '@/modules/vms/__mocks__/vm.mock';

describe('PreviewShutdownUseCase', () => {
  let useCase: PreviewShutdownUseCase;
  let groupServerRepository: jest.Mocked<Repository<GroupServer>>;
  let groupVmRepository: jest.Mocked<Repository<GroupVm>>;

  beforeEach(() => {
    groupServerRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    groupVmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    useCase = new PreviewShutdownUseCase(
      groupServerRepository,
      groupVmRepository,
    );
  });

  it('should preview shutdown sequence for servers and VMs', async () => {
    const server1 = createMockServer({ id: 'server-1', name: 'Server 1' });
    const server2 = createMockServer({ id: 'server-2', name: 'Server 2' });
    const vm1 = createMockVm({ id: 'vm-1', name: 'VM 1' });
    const vm2 = createMockVm({ id: 'vm-2', name: 'VM 2' });

    const groupServer = createMockGroupServer({
      id: 'group-server-1',
      name: 'Server Group',
      priority: 2,
      servers: [server1, server2],
    });

    const groupVm = createMockGroupVm({
      id: 'group-vm-1',
      name: 'VM Group',
      priority: 1,
      vms: [vm1, vm2],
      serverGroupId: 'group-server-1',
    });

    groupServerRepository.find.mockResolvedValue([groupServer]);
    groupVmRepository.find.mockResolvedValue([groupVm]);

    const result = await useCase.execute(['group-server-1', 'group-vm-1']);

    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]).toEqual({
      order: 1,
      type: 'vm',
      entityId: 'vm-1',
      entityName: 'VM 1',
      groupId: 'group-vm-1',
      groupName: 'VM Group',
      priority: 1,
    });
    expect(result.steps[1]).toEqual({
      order: 2,
      type: 'vm',
      entityId: 'vm-2',
      entityName: 'VM 2',
      groupId: 'group-vm-1',
      groupName: 'VM Group',
      priority: 1,
    });
    expect(result.steps[2]).toEqual({
      order: 3,
      type: 'server',
      entityId: 'server-1',
      entityName: 'Server 1',
      groupId: 'group-server-1',
      groupName: 'Server Group',
      priority: 2,
    });
    expect(result.steps[3]).toEqual({
      order: 4,
      type: 'server',
      entityId: 'server-2',
      entityName: 'Server 2',
      groupId: 'group-server-1',
      groupName: 'Server Group',
      priority: 2,
    });
  });

  it('should handle groups with cascade disabled', async () => {
    const groupServer = createMockGroupServer({
      id: 'group-server-1',
      cascade: false,
      servers: [createMockServer({ id: 'server-1' })],
    });

    groupServerRepository.find.mockResolvedValue([groupServer]);
    groupVmRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(['group-server-1']);

    expect(result.steps).toHaveLength(0);
    expect(result.totalVms).toBe(0);
    expect(result.totalServers).toBe(0);
  });

  it('should order by priority correctly', async () => {
    const highPriorityGroup = createMockGroupServer({
      id: 'group-1',
      priority: 4,
      cascade: true,
      servers: [
        createMockServer({ id: 'server-1', name: 'High Priority Server' }),
      ],
    });

    const lowPriorityGroup = createMockGroupServer({
      id: 'group-2',
      priority: 1,
      cascade: true,
      servers: [
        createMockServer({ id: 'server-2', name: 'Low Priority Server' }),
      ],
    });

    groupServerRepository.find.mockResolvedValue([
      highPriorityGroup,
      lowPriorityGroup,
    ]);
    groupVmRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(['group-1', 'group-2']);

    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].entityName).toBe('High Priority Server');
    expect(result.steps[1].entityName).toBe('Low Priority Server');
  });

  it('should throw error for non-existent groups', async () => {
    groupServerRepository.find.mockResolvedValue([]);
    groupVmRepository.find.mockResolvedValue([]);

    await expect(useCase.execute(['non-existent'])).rejects.toThrow(
      'Groups not found: non-existent',
    );
  });
});
