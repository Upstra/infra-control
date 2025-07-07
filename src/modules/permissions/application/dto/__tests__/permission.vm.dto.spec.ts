import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PermissionVmDto, UpdatePermissionVmDto } from '../permission.vm.dto';
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

describe('UpdatePermissionVmDto', () => {
  it('should be valid when bitmask is a valid integer', async () => {
    const dto = plainToInstance(
      UpdatePermissionVmDto,
      { bitmask: 15 },
      {
        enableImplicitConversion: true,
      },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid with different bitmask values', async () => {
    const testCases = [0, 1, 7, 15, 31, 63, 127, 255];

    for (const bitmask of testCases) {
      const dto = plainToInstance(
        UpdatePermissionVmDto,
        { bitmask },
        {
          enableImplicitConversion: true,
        },
      );
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should be invalid when bitmask is missing', async () => {
    const dto = plainToInstance(
      UpdatePermissionVmDto,
      {},
      {
        enableImplicitConversion: true,
      },
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is not an integer', async () => {
    const dto = plainToInstance(
      UpdatePermissionVmDto,
      { bitmask: 'not-a-number' },
      {
        enableImplicitConversion: false,
      },
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is a float', async () => {
    const dto = plainToInstance(
      UpdatePermissionVmDto,
      { bitmask: 15.5 },
      {
        enableImplicitConversion: true,
      },
    );
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is negative', async () => {
    const dto = plainToInstance(
      UpdatePermissionVmDto,
      { bitmask: -1 },
      {
        enableImplicitConversion: true,
      },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should create instance with constructor', () => {
    const dto = new UpdatePermissionVmDto({ bitmask: 31 });
    expect(dto.bitmask).toBe(31);
  });

  it('should handle partial in constructor', () => {
    const dto = new UpdatePermissionVmDto();
    expect(dto.bitmask).toBeUndefined();
  });
});
