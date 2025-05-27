import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { VmCreationDto } from '../vm.creation.dto';
import { VmUpdateDto } from '../vm.update.dto';
import { VmResponseDto } from '../vm.response.dto';
import { createMockVm } from '@/modules/vms/__mocks__/vms.mock';

describe('VmCreationDto', () => {
  it('should validate a correct payload', async () => {
    const dto = plainToInstance(VmCreationDto, {
      name: 'vm',
      state: 'UP',
      grace_period_on: 10,
      grace_period_off: 5,
      os: 'Linux',
      adminUrl: 'http://localhost',
      ip: '192.168.0.1',
      login: 'admin',
      password: 'admin123',
      priority: 1,
      serverId: crypto.randomUUID(),
      groupId: crypto.randomUUID(),
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail on missing required fields', async () => {
    const dto = plainToInstance(VmCreationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('VmUpdateDto', () => {
  it('should validate with partial payload', async () => {
    const dto = plainToInstance(VmUpdateDto, {
      name: 'updated-name',
      priority: 2,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe('VmResponseDto', () => {
  it('should map correctly from Vm entity', () => {
    const mockVm = createMockVm({
      state: 'UP',
      grace_period_on: 10,
      grace_period_off: 5,
      os: 'Linux',
      adminUrl: 'http://admin',
      ip: '192.168.0.10',
      login: 'admin',
      password: 'secret',
      priority: 2,
      groupId: crypto.randomUUID(),
      serverId: crypto.randomUUID(),
    });

    const dto = new VmResponseDto(mockVm);
    expect(dto.name).toBe(mockVm.name);
    expect(dto.priority).toBe(mockVm.priority);
    expect(dto.groupId).toBe(mockVm.groupId);
    expect(dto.serverId).toBe(mockVm.serverId);
  });
});
