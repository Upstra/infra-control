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

    expect(result.items).toHaveLength(4);
    expect(result.totalItems).toBe(4);
    expect(result.totalVms).toBe(2);
    expect(result.totalServers).toBe(2);
    expect(result.items[0]).toEqual({
      order: 1,
      type: 'vm',
      entityId: 'vm-1',
      entityName: 'VM 1',
      groupId: 'group-vm-1',
      groupName: 'VM Group',
      priority: 1,
    });
    expect(result.items[1]).toEqual({
      order: 2,
      type: 'vm',
      entityId: 'vm-2',
      entityName: 'VM 2',
      groupId: 'group-vm-1',
      groupName: 'VM Group',
      priority: 1,
    });
    expect(result.items[2]).toEqual({
      order: 3,
      type: 'server',
      entityId: 'server-1',
      entityName: 'Server 1',
      groupId: 'group-server-1',
      groupName: 'Server Group',
      priority: 2,
    });
    expect(result.items[3]).toEqual({
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

    expect(result.items).toHaveLength(0);
    expect(result.totalItems).toBe(0);
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

    expect(result.items).toHaveLength(2);
    expect(result.totalItems).toBe(2);
    expect(result.items[0].entityName).toBe('High Priority Server');
    expect(result.items[1].entityName).toBe('Low Priority Server');
  });

  it('should throw error for non-existent groups', async () => {
    groupServerRepository.find.mockResolvedValue([]);
    groupVmRepository.find.mockResolvedValue([]);

    await expect(useCase.execute(['non-existent'])).rejects.toThrow(
      'Groups not found: non-existent',
    );
  });

  it('should handle VMs with null properties', async () => {
    const vmGroups = [
      createMockGroupVm({
        id: 'group-vm-1',
        name: 'VM Group',
        priority: 1,
        cascade: true,
        vms: [
          { id: 'vm-1', name: 'VM 1' } as any,
          { id: null, name: 'VM without ID' } as any,
          { id: 'vm-3', name: null } as any,
          { id: null, name: null } as any,
        ],
      }),
    ];

    groupVmRepository.find.mockResolvedValue(vmGroups);
    groupServerRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(['group-vm-1']);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        entityId: 'vm-1',
        entityName: 'VM 1',
      }),
    );
  });

  it('should handle servers with null properties', async () => {
    const serverGroups = [
      createMockGroupServer({
        id: 'group-server-1',
        name: 'Server Group',
        priority: 1,
        cascade: true,
        servers: [
          { id: 'server-1', name: 'Server 1' } as any,
          { id: null, name: 'Server without ID' } as any,
          { id: 'server-3', name: null } as any,
          { id: null, name: null } as any,
        ],
      }),
    ];

    groupServerRepository.find.mockResolvedValue(serverGroups);
    groupVmRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(['group-server-1']);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        entityId: 'server-1',
        entityName: 'Server 1',
      }),
    );
  });

  it('should handle pagination bounds correctly', async () => {
    const vmGroups = Array.from({ length: 5 }, (_, i) =>
      createMockGroupVm({
        id: `group-vm-${i}`,
        name: `VM Group ${i}`,
        priority: 1,
        cascade: true,
        vms: [createMockVm({ id: `vm-${i}`, name: `VM ${i}` })],
      }),
    );

    groupVmRepository.find.mockResolvedValue(vmGroups);
    groupServerRepository.find.mockResolvedValue([]);

    const groupIds = vmGroups.map((g) => g.id);
    const result = await useCase.execute(groupIds, 10, 10);

    expect(result.items).toHaveLength(0);
    expect(result.currentPage).toBe(10);
    expect(result.totalItems).toBe(5);
  });

  it('should handle edge case with exactly limit items', async () => {
    const servers = Array.from({ length: 10 }, (_, i) =>
      createMockServer({ id: `server-${i}`, name: `Server ${i}` }),
    );

    const serverGroup = createMockGroupServer({
      id: 'group-server-1',
      name: 'Server Group',
      priority: 1,
      cascade: true,
      servers,
    });

    groupServerRepository.find.mockResolvedValue([serverGroup]);
    groupVmRepository.find.mockResolvedValue([]);

    const result = await useCase.execute(['group-server-1'], 1, 10);

    expect(result.items).toHaveLength(10);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
  });
});
