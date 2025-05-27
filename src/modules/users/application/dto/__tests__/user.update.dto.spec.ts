import 'reflect-metadata';
import { validate } from 'class-validator';
import { UserUpdateDto } from '../user.update.dto';
import { v4 as uuidv4 } from 'uuid';

describe('UserUpdateDto', () => {
  it('should be valid with correct lengths', async () => {
    const dto = new UserUpdateDto();
    (dto as any).username = 'James';
    (dto as any).firstName = 'Jean';
    (dto as any).lastName = 'Dupont';
    (dto as any).email = 'jean.dupont@example.com';
    (dto as any).roleId = uuidv4();

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail if username too short', async () => {
    const dto = new UserUpdateDto();
    (dto as any).username = 'J';
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isLength');
  });

  it('should fail if roleId is not uuid', async () => {
    const dto = new UserUpdateDto();
    (dto as any).roleId = 'not-a-uuid';
    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });

  it('should be valid with only one field (partial update)', async () => {
    const dto = new UserUpdateDto();
    (dto as any).firstName = 'Luc';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
