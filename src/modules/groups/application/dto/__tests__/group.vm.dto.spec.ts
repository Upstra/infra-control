import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { GroupVmDto } from '../group.vm.dto';

describe('GroupVmDto', () => {
  it('should be valid with correct fields', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 'Test Group',
      priority: 1,
      serverGroupId: '550e8400-e29b-41d4-a716-446655440000',
      vmIds: [
        '9c53b8d6-1d25-44f1-8c14-df50fc668d8b',
        'ae6a9c0a-238a-4a2b-9491-6b5a93425ee1',
      ],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be valid without vmIds (optional)', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 'Test Group',
      priority: 2,
      serverGroupId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid with missing name', async () => {
    const dto = plainToInstance(GroupVmDto, {
      priority: 3,
      serverGroupId: '550e8400-e29b-41d4-a716-446655440000',
      vmIds: ['9c53b8d6-1d25-44f1-8c14-df50fc668d8b'],
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid with non-string name', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 12345,
      priority: 3,
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid with missing priority', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 'Missing Priority',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('should be invalid with non-number priority', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 'Not a number',
      priority: 'high',
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'priority')).toBe(true);
  });

  it('should be invalid with vmIds not array of uuid', async () => {
    const dto = plainToInstance(GroupVmDto, {
      name: 'Bad VMIDs',
      priority: 1,
      vmIds: [123, 'not-an-uuid'],
    });

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'vmIds')).toBe(true);
  });
});
