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

  it('should be valid when allowWrite and allowRead are missing (optional)', async () => {
    const dto = plainToInstance(
      PermissionVmDto,
      createMockPermissionVmDto({
        allowWrite: undefined,
        allowRead: undefined,
      }),
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
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
      allowWrite: 'non',
      allowRead: 'oui',
    };

    const dto = plainToInstance(PermissionVmDto, raw, {
      enableImplicitConversion: false,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'allowWrite')).toBe(true);
    expect(errors.some((e) => e.property === 'allowRead')).toBe(true);
  });
});
