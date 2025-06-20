import { validate } from 'class-validator';
import { CompleteVmDiscoveryDto } from '../complete-vm-discovery.dto';

describe('CompleteVmDiscoveryDto', () => {
  const buildDto = (
    partial: Partial<CompleteVmDiscoveryDto> = {},
  ): CompleteVmDiscoveryDto => {
    return Object.assign(new CompleteVmDiscoveryDto(), {
      serverId: '550e8400-e29b-41d4-a716-446655440000',
      vmCount: 3,
      vmIds: ['vm1', 'vm2'],
      ...partial,
    });
  };

  it('validates a complete dto', async () => {
    const dto = buildDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('allows optional vmIds', async () => {
    const dto = buildDto({ vmIds: undefined });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails for invalid serverId', async () => {
    const dto = buildDto({ serverId: 'bad-id' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('serverId');
  });
});
