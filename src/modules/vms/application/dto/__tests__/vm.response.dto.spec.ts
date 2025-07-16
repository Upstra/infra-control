import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';
import { VmResponseDto } from '../vm.response.dto';

describe('VmResponseDto', () => {
  it('should correctly map Vm entity to DTO', () => {
    const mockVm = createMockVm({
      name: 'TestVM',
      state: 'UP',
      os: 'Ubuntu',
      adminUrl: 'https://admin.local',
      ip: '192.168.10.1',
      priority: 2,
      groupId: crypto.randomUUID(),
      serverId: crypto.randomUUID(),
    });

    const dto = new VmResponseDto(mockVm);

    expect(dto).toMatchObject({
      name: mockVm.name,
      state: mockVm.state,
      os: mockVm.os,
      adminUrl: mockVm.adminUrl,
      ip: mockVm.ip,
      priority: mockVm.priority,
      groupId: mockVm.groupId,
      serverId: mockVm.serverId,
    });
  });
});
