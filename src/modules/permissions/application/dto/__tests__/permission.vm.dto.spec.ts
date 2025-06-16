import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PermissionVmDto } from '../permission.vm.dto';
import { createMockPermissionVmDto } from '@/modules/permissions/__mocks__/permissions.mock';

describe('PermissionVmDto', () => {
  it('should be valid when all fields correct', async () => {
    const dto = plainToInstance(PermissionVmDto, createMockPermissionVmDto(), {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid when bitmask is missing', async () => {
    const dto = plainToInstance(
      PermissionVmDto,
      { vmId: 'foo', roleId: 'bar' },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should be invalid with invalid UUIDs', async () => {
    const dto = plainToInstance(
      PermissionVmDto,
      createMockPermissionVmDto({
        roleId: 'bad-uuid',
        vmId: 'not-a-uuid',
      }),
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
    expect(errors.some((e) => e.property === 'vmId')).toBe(true);
  });

  it('should be invalid if allowWrite/allowRead are not boolean', async () => {
    const raw = {
      ...createMockPermissionVmDto(),
      bitmask: 'non',
    };

    const dto = plainToInstance(PermissionVmDto, raw, {
      enableImplicitConversion: false,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });
});
