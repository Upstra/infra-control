import { validate } from 'class-validator';
import { VmUpdateDto } from '../vm.update.dto';

describe('VmUpdateDto', () => {
  it('should be valid with no properties', async () => {
    const dto = new VmUpdateDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid with all optional fields filled correctly', async () => {
    const dto = Object.assign(new VmUpdateDto(), {
      name: 'VM-Test',
      state: 'UP',
      grace_period_on: 15,
      grace_period_off: 10,
      os: 'Ubuntu',
      adminUrl: 'https://admin.local',
      ip: '192.168.1.100',
      login: 'root',
      password: 'password123',
      priority: 3,
      serverId: crypto.randomUUID(),
      groupId: crypto.randomUUID(),
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if serverId is not UUID', async () => {
    const dto = Object.assign(new VmUpdateDto(), {
      serverId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('serverId');
  });
});
