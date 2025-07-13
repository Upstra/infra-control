import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ServerCreationDto } from '../server.creation.dto';
import { createMockIloCreationDto } from '@/modules/ilos/__mocks__/ilo.mock';

describe('ServerCreationDto', () => {
  it('should validate a correct DTO', async () => {
    const dto = plainToInstance(ServerCreationDto, {
      name: 'My Server',
      state: 'UP',
      grace_period_on: 10,
      grace_period_off: 5,
      adminUrl: 'https://admin.local',
      ip: '192.168.0.1',
      login: 'admin',
      password: 'pass',
      type: 'esxi',
      priority: 1,
      roomId: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      ilo: createMockIloCreationDto({
        name: 'ILO-Test',
        ip: '10.0.0.1',
        login: 'admin',
        password: 'adminpass',
      }),
    });
    await expect(validateOrReject(dto)).resolves.toBeUndefined();
  });

  it('should fail with invalid UUID', async () => {
    const dto = plainToInstance(ServerCreationDto, {
      name: 'My Server',
      state: 'UP',
      grace_period_on: 10,
      grace_period_off: 5,
      adminUrl: 'https://admin.local',
      ip: '192.168.0.1',
      login: 'admin',
      password: 'pass',
      type: 'esxi',
      priority: 1,
      roomId: 'not-a-uuid',
    });
    await expect(validateOrReject(dto)).rejects.toBeDefined();
  });

  it('should fail with missing required fields', async () => {
    const dto = plainToInstance(ServerCreationDto, {
      name: 'Server Missing',
    });
    await expect(validateOrReject(dto)).rejects.toBeDefined();
  });
});
