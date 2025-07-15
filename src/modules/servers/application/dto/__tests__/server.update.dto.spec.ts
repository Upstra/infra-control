import { validateOrReject } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ServerUpdateDto } from '../server.update.dto';

describe('ServerUpdateDto', () => {
  it('should validate with partial fields', async () => {
    const dto = plainToInstance(ServerUpdateDto, {
      name: 'Updated Server',
    });
    await expect(validateOrReject(dto)).resolves.toBeUndefined();
  });

  it('should validate with full optional update', async () => {
    const dto = plainToInstance(ServerUpdateDto, {
      name: 'Updated Server',
      priority: 2,
    });
    await expect(validateOrReject(dto)).resolves.toBeUndefined();
  });

  it('should fail with invalid UUIDs in optional fields', async () => {
    const dto = plainToInstance(ServerUpdateDto, {
      groupId: 'not-a-uuid',
    });
    await expect(validateOrReject(dto)).rejects.toBeDefined();
  });
});
