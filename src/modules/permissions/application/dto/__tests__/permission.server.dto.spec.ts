import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PermissionServerDto, UpdatePermissionServerDto } from '../permission.server.dto';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

const createMockPermissionServerDto = (
  overrides?: Partial<PermissionServerDto>,
) => ({
  roleId: '76cbb7e2-cd5d-47b5-a5cd-2e162b42c7f9',
  serverId: '6b5f9f60-5611-4e38-87a8-6ab1431d60fd',
  bitmask: PermissionBit.READ | PermissionBit.WRITE,
  ...overrides,
});

describe('PermissionServerDto', () => {
  it('should be valid when all fields correct', async () => {
    const dto = plainToInstance(
      PermissionServerDto,
      createMockPermissionServerDto(),
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with invalid UUIDs', async () => {
    const dto = plainToInstance(
      PermissionServerDto,
      createMockPermissionServerDto({
        roleId: 'bad-uuid',
        serverId: 'bad-uuid',
      }),
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'roleId')).toBe(true);
    expect(errors.some((e) => e.property === 'serverId')).toBe(true);
  });

  it('should be invalid if allowWrite or allowRead missing', async () => {
    let dto = plainToInstance(
      PermissionServerDto,
      createMockPermissionServerDto({ bitmask: undefined }),
    );
    let errors = await validate(dto);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);

    dto = plainToInstance(
      PermissionServerDto,
      createMockPermissionServerDto({ bitmask: undefined }),
    );
    errors = await validate(dto);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid if allowWrite or allowRead are not boolean', async () => {
    const dto = plainToInstance(
      PermissionServerDto,
      createMockPermissionServerDto({
        bitmask: 'yes' as any,
      }),
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });
});

describe('UpdatePermissionServerDto', () => {
  it('should be valid when bitmask is a valid integer', async () => {
    const dto = plainToInstance(UpdatePermissionServerDto, { bitmask: 15 }, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid with different bitmask values', async () => {
    const testCases = [0, 1, 7, 15, 31, 63, 127, 255];
    
    for (const bitmask of testCases) {
      const dto = plainToInstance(UpdatePermissionServerDto, { bitmask }, {
        enableImplicitConversion: true,
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should be invalid when bitmask is missing', async () => {
    const dto = plainToInstance(UpdatePermissionServerDto, {}, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is not an integer', async () => {
    const dto = plainToInstance(UpdatePermissionServerDto, { bitmask: 'not-a-number' }, {
      enableImplicitConversion: false,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is a float', async () => {
    const dto = plainToInstance(UpdatePermissionServerDto, { bitmask: 15.5 }, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'bitmask')).toBe(true);
  });

  it('should be invalid when bitmask is negative', async () => {
    const dto = plainToInstance(UpdatePermissionServerDto, { bitmask: -1 }, {
      enableImplicitConversion: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should create instance with constructor', () => {
    const dto = new UpdatePermissionServerDto({ bitmask: 31 });
    expect(dto.bitmask).toBe(31);
  });

  it('should handle partial in constructor', () => {
    const dto = new UpdatePermissionServerDto();
    expect(dto.bitmask).toBeUndefined();
  });
});
