import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RoleCreationDto } from '../role.creation.dto';

describe('RoleCreationDto', () => {
  it('should be valid with a name', async () => {
    const dto = plainToInstance(RoleCreationDto, { name: 'admin' });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should be invalid if name is missing', async () => {
    const dto = plainToInstance(RoleCreationDto, {});
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('should be invalid if name is not a string', async () => {
    const dto = plainToInstance(RoleCreationDto, { name: 123 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
