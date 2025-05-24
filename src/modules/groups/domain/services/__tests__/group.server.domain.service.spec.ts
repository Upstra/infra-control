import { GroupServerDto } from '@/modules/groups/application/dto/group.server.dto';
import { GroupServerDomainService } from '../group.server.domain.service';
import { GroupServer } from '../../entities/group.server.entity';

describe('GroupServerDomainService', () => {
  const service = new GroupServerDomainService();

  it('should map dto to new GroupServer on createGroup', () => {
    const dto: GroupServerDto = { name: 'myGroup', priority: 1 };
    const entity = service.createGroup(dto);

    expect(entity).toBeInstanceOf(GroupServer);
    expect(entity.name).toBe('myGroup');
    expect(entity.priority).toBe(1);
  });

  it('should update properties on updateGroupEntityFromDto', () => {
    const existing = new GroupServer();
    existing.name = 'old';
    existing.priority = 2;

    const dto: GroupServerDto = { name: 'new', priority: 5 };
    const updated = service.updateGroupEntityFromDto(existing, dto);

    expect(updated.name).toBe('new');
    expect(updated.priority).toBe(5);
    expect(updated).toBe(existing);
  });
});
