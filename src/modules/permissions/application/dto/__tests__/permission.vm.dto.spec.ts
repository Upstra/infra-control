import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PermissionVmDto } from '../permission.vm.dto';

const createMockPermissionVmDto = (overrides?: Partial<PermissionVmDto>) => ({
  roleId: 'fedcba98-7654-4321-abcd-1234567890ef',
  vmId: '01234567-89ab-cdef-0123-456789abcdef',
  allowWrite: true,
  allowRead: false,
  ...overrides,
});

describe('PermissionVmDto', () => {
  it('should be valid when all fields correct', async () => {
    const dto = plainToInstance(PermissionVmDto, createMockPermissionVmDto());
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
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
    expect(errors.some((e) => e.property === 'vmId')).toBe(true);
  });

  it('should be invalid if allowWrite/allowRead are not boolean', async () => {
    const dto = plainToInstance(
      PermissionVmDto,
      createMockPermissionVmDto({
        allowWrite: 'non' as any,
        allowRead: 'yes' as any,
      }),
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'allowWrite')).toBe(true);
    expect(errors.some((e) => e.property === 'allowRead')).toBe(true);
  });
});
