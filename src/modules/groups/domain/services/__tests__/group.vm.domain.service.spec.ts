import { GroupVmDto } from '@/modules/groups/application/dto/group.vm.dto';
import { GroupVmDomainService } from '../group.vm.domain.service';
import { GroupVm } from '../../entities/group.vm.entity';

describe('GroupVmDomainService', () => {
  const service = new GroupVmDomainService();

  it('should create a GroupVm from DTO', () => {
    const dto: GroupVmDto = {
      name: 'myVmGroup',
      priority: 4,
      serverGroupId: 'server-group-123',
    };
    const entity = service.createGroup(dto);

    expect(entity).toBeInstanceOf(GroupVm);
    expect(entity.name).toBe('myVmGroup');
    expect(entity.priority).toBe(4);
  });

  it('should update a GroupVm from DTO', () => {
    const group = new GroupVm();
    group.name = 'before';
    group.priority = 1;

    const dto: GroupVmDto = {
      name: 'after',
      priority: 9,
      serverGroupId: 'server-group-456',
    };
    const result = service.updateGroupEntityFromDto(group, dto);

    expect(result.name).toBe('after');
    expect(result.priority).toBe(9);
    expect(result).toBe(group);
  });
});
