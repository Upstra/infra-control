import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GroupServerDto } from '../group.server.dto';

describe('GroupServerDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 1,
        serverIds: [
          '123e4567-e89b-12d3-a456-426614174000',
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with non-string name', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 42,
        priority: 1,
        serverIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
      { enableImplicitConversion: false },
    );

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid with non-number priority', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 'high',
        serverIds: ['123e4567-e89b-12d3-a456-426614174000'],
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('should be invalid with non-uuid serverIds', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 1,
        serverIds: ['not-a-uuid', 12345],
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'serverIds')).toBe(true);
  });

  it('should be valid if serverIds is omitted (optional)', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 1,
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if serverIds is not an array', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 1,
        serverIds: '123e4567-e89b-12d3-a456-426614174000',
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'serverIds')).toBe(true);
  });

  it('should have cascade default value of true when not provided', () => {
    const dto = new GroupServerDto({
      name: 'Test Group',
      priority: 1,
    });
    expect(dto.cascade).toBe(true);
  });

  it('should override cascade default value when explicitly set to false', () => {
    const dto = new GroupServerDto({
      name: 'Test Group',
      priority: 1,
      cascade: false,
    });
    expect(dto.cascade).toBe(false);
  });

  it('should be valid with cascade as boolean', async () => {
    const dto = plainToInstance(
      GroupServerDto,
      {
        name: 'Critique',
        priority: 1,
        cascade: false,
      },
      { enableImplicitConversion: true },
    );
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
