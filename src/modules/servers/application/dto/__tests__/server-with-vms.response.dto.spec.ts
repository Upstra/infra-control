import { validate } from 'class-validator';
import { ServerWithVmsResponseDto } from '../server-with-vms.response.dto';
import { VmLightDto } from '../../../../vms/application/dto/vm.light.dto';
import { Server } from '../../../domain/entities/server.entity';
import { Vm } from '../../../../vms/domain/entities/vm.entity';

describe('ServerWithVmsResponseDto', () => {
  const mockVm1: Vm = {
    id: 'vm-1',
    name: 'VM-Server1-01',
    state: 'running',
    serverId: 'server-1',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 1,
  } as Vm;

  const mockVm2: Vm = {
    id: 'vm-2',
    name: 'VM-Server1-02',
    state: 'stopped',
    serverId: 'server-1',
    grace_period_on: 300,
    grace_period_off: 300,
    priority: 2,
  } as Vm;

  const mockServer = {
    id: 'server-1',
    name: 'ESXi-Server-01',
    ip: '192.168.1.10',
    vmwareHostMoid: 'host-123',
    vms: [mockVm1, mockVm2],
    state: 'UP',
    type: 'ESXi',
    adminUrl: 'https://192.168.1.10',
    login: 'admin',
    priority: 1,
    roomId: 'room-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Server;

  describe('constructor', () => {
    it('should create ServerWithVmsResponseDto with server data and VMs', () => {
      // Arrange
      const vmDtos = [
        new VmLightDto(mockVm1),
        new VmLightDto(mockVm2)
      ];

      // Act
      const dto = new ServerWithVmsResponseDto(mockServer, vmDtos);

      // Assert
      expect(dto.id).toBe(mockServer.id);
      expect(dto.name).toBe(mockServer.name);
      expect(dto.ip).toBe(mockServer.ip);
      expect(dto.hostMoid).toBe(mockServer.vmwareHostMoid);
      expect(dto.vms).toHaveLength(2);
      expect(dto.vms[0]).toEqual({
        id: 'vm-1',
        name: 'VM-Server1-01',
        state: 'running'
      });
      expect(dto.vms[1]).toEqual({
        id: 'vm-2',
        name: 'VM-Server1-02',
        state: 'stopped'
      });
    });

    it('should create ServerWithVmsResponseDto with empty VMs array when no VMs provided', () => {
      // Act
      const dto = new ServerWithVmsResponseDto(mockServer);

      // Assert
      expect(dto.vms).toEqual([]);
    });

    it('should handle server without vmwareHostMoid', () => {
      // Arrange
      const serverWithoutMoid = { ...mockServer, vmwareHostMoid: undefined } as Server;

      // Act
      const dto = new ServerWithVmsResponseDto(serverWithoutMoid);

      // Assert
      expect(dto.hostMoid).toBeUndefined();
    });
  });

  describe('fromEntity', () => {
    it('should create ServerWithVmsResponseDto from server entity with VMs', () => {
      // Act
      const dto = ServerWithVmsResponseDto.fromEntity(mockServer);

      // Assert
      expect(dto).toBeInstanceOf(ServerWithVmsResponseDto);
      expect(dto.id).toBe(mockServer.id);
      expect(dto.name).toBe(mockServer.name);
      expect(dto.ip).toBe(mockServer.ip);
      expect(dto.hostMoid).toBe(mockServer.vmwareHostMoid);
      expect(dto.vms).toHaveLength(2);
      expect(dto.vms[0]).toEqual({
        id: 'vm-1',
        name: 'VM-Server1-01',
        state: 'running'
      });
    });

    it('should handle server entity without VMs', () => {
      // Arrange
      const serverWithoutVms = { ...mockServer, vms: undefined } as Server;

      // Act
      const dto = ServerWithVmsResponseDto.fromEntity(serverWithoutVms);

      // Assert
      expect(dto.vms).toEqual([]);
    });

    it('should handle server entity with empty VMs array', () => {
      // Arrange
      const serverWithEmptyVms = { ...mockServer, vms: [] } as Server;

      // Act
      const dto = ServerWithVmsResponseDto.fromEntity(serverWithEmptyVms);

      // Assert
      expect(dto.vms).toEqual([]);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      // Arrange
      const dto = new ServerWithVmsResponseDto(mockServer, [new VmLightDto(mockVm1)]);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when id is missing', async () => {
      // Arrange
      const invalidServer = { ...mockServer, id: '' } as Server;
      const dto = new ServerWithVmsResponseDto(invalidServer);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when name is missing', async () => {
      // Arrange
      const invalidServer = { ...mockServer, name: '' } as Server;
      const dto = new ServerWithVmsResponseDto(invalidServer);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when ip is missing', async () => {
      // Arrange
      const invalidServer = { ...mockServer, ip: '' } as Server;
      const dto = new ServerWithVmsResponseDto(invalidServer);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ip');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when id is not a valid UUID', async () => {
      // Arrange
      const invalidServer = { ...mockServer, id: 'not-a-uuid' } as Server;
      const dto = new ServerWithVmsResponseDto(invalidServer);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('id');
      expect(errors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail validation when vms array contains invalid VmLightDto', async () => {
      // Arrange
      const invalidVmDto = { id: 'not-a-uuid', name: '', state: 'running' } as any;
      const dto = new ServerWithVmsResponseDto(mockServer, [invalidVmDto]);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('vms');
      expect(errors[0].constraints).toHaveProperty('nestedValidation');
    });
  });

  describe('structure verification', () => {
    it('should only include essential server fields', () => {
      // Act
      const dto = new ServerWithVmsResponseDto(mockServer);

      // Assert
      expect(dto).toEqual({
        id: 'server-1',
        name: 'ESXi-Server-01',
        ip: '192.168.1.10',
        hostMoid: 'host-123',
        vms: []
      });

      // These properties should not be included in the light DTO
      expect(dto).not.toHaveProperty('state');
      expect(dto).not.toHaveProperty('type');
      expect(dto).not.toHaveProperty('adminUrl');
      expect(dto).not.toHaveProperty('login');
      expect(dto).not.toHaveProperty('priority');
      expect(dto).not.toHaveProperty('roomId');
      expect(dto).not.toHaveProperty('createdAt');
      expect(dto).not.toHaveProperty('updatedAt');
    });

    it('should maintain VMs array structure', () => {
      // Act
      const dto = ServerWithVmsResponseDto.fromEntity(mockServer);

      // Assert
      expect(Array.isArray(dto.vms)).toBe(true);
      dto.vms.forEach(vm => {
        expect(vm).toHaveProperty('id');
        expect(vm).toHaveProperty('name');
        expect(vm).toHaveProperty('state');
        expect(Object.keys(vm)).toHaveLength(3); // Only these 3 properties
      });
    });
  });
});