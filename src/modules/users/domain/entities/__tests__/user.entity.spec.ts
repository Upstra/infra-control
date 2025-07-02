import { User } from '../user.entity';
import { Role } from '@/modules/roles/domain/entities/role.entity';

describe('User Entity', () => {
  it('can have multiple roles', () => {
    const user = new User();
    const admin = new Role();
    admin.id = 'r1';
    const team = new Role();
    team.id = 'r2';
    user.roles = [admin, team];
    expect(user.roles).toHaveLength(2);
    expect(user.roles[0].id).toBe('r1');
    expect(user.roles[1].id).toBe('r2');
  });
});
