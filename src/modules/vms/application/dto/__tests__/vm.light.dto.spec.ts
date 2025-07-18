import { validate } from 'class-validator';
import { VmLightDto } from '../vm.light.dto';
import { Vm } from '../../../domain/entities/vm.entity';

describe('VmLightDto', () => {
  const mockVm: Vm = {
    id: 'vm-123',
    name: 'Test VM',
    state: 'running',
    serverId: 'server-123',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 1,
    os: 'Ubuntu 22.04',
    ip: '192.168.1.100',
    moid: 'vm-moid-123',
    createDate: new Date('2023-01-01'),
    numCPU: 4,
    numCoresPerSocket: 2,
    esxiHostName: 'esxi-host-01',
    esxiHostMoid: 'host-123',
    adminUrl: 'https://vcenter.example.com',
    login: 'admin',
    groupId: 'group-123',
    version: '19',
    guestOs: 'Ubuntu Linux (64-bit)',
    guestFamily: 'linuxGuest',
    lastSyncAt: new Date('2023-01-01'),
  } as Vm;

  describe('constructor', () => {
    it('should create VmLightDto with essential fields from VM entity', () => {
      // Act
      const dto = new VmLightDto(mockVm);

      // Assert
      expect(dto.id).toBe(mockVm.id);
      expect(dto.name).toBe(mockVm.name);
      expect(dto.state).toBe(mockVm.state);
    });

    it('should only include essential fields and exclude other VM properties', () => {
      // Act
      const dto = new VmLightDto(mockVm);

      // Assert
      expect(dto).toEqual({
        id: 'vm-123',
        name: 'Test VM',
        state: 'running',
      });

      // These properties should not be included in the light DTO
      expect(dto).not.toHaveProperty('serverId');
      expect(dto).not.toHaveProperty('os');
      expect(dto).not.toHaveProperty('ip');
      expect(dto).not.toHaveProperty('priority');
      expect(dto).not.toHaveProperty('grace_period_on');
      expect(dto).not.toHaveProperty('grace_period_off');
    });
  });

  describe('fromEntity', () => {
    it('should create VmLightDto from VM entity using static method', () => {
      // Act
      const dto = VmLightDto.fromEntity(mockVm);

      // Assert
      expect(dto).toBeInstanceOf(VmLightDto);
      expect(dto.id).toBe(mockVm.id);
      expect(dto.name).toBe(mockVm.name);
      expect(dto.state).toBe(mockVm.state);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      const dto = new VmLightDto(mockVm);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id is missing', async () => {
      // Arrange
      const invalidVm = { ...mockVm, id: '' } as Vm;
      const dto = new VmLightDto(invalidVm);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is missing', async () => {
      // Arrange
      const invalidVm = { ...mockVm, name: '' } as Vm;
      const dto = new VmLightDto(invalidVm);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when state is missing', async () => {
      // Arrange
      const invalidVm = { ...mockVm, state: '' } as Vm;
      const dto = new VmLightDto(invalidVm);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('state');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when id is not a valid UUID', async () => {
      // Arrange
      const invalidVm = { ...mockVm, id: 'not-a-uuid' } as Vm;
      const dto = new VmLightDto(invalidVm);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });
  });

  describe('different VM states', () => {
    const vmStates = ['running', 'stopped', 'suspended', 'poweredOff', 'poweredOn'];

    vmStates.forEach(state => {
      it(`should handle VM in ${state} state`, () => {
        // Arrange
        const vmWithState = { ...mockVm, state } as Vm;

        // Act
        const dto = new VmLightDto(vmWithState);

        // Assert
        expect(dto.state).toBe(state);
      });
    });
  });
});