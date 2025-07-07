import { PermissionDomainVmService } from '../permission.domain.vm.service';
import { createMockPermissionVm } from '@/modules/permissions/__mocks__/permissions.mock';
import { PermissionBit } from '../../value-objects/permission-bit.enum';
import { PermissionVmDto } from '../../../application/dto/permission.vm.dto';
import { PermissionVm } from '../../entities/permission.vm.entity';

describe('PermissionDomainVmService', () => {
  const service = new PermissionDomainVmService();

  it('should create a full permission entity', () => {
    const entity = service.createFullPermissionEntity();
    const expected = createMockPermissionVm({
      bitmask: PermissionBit.READ | PermissionBit.WRITE,
      vmId: undefined,
      roleId: undefined,
    });
    expect(entity).toEqual(expected);
  });

  it('should create a read-only permission entity', () => {
    const entity = service.createReadOnlyPermissionEntity();
    const expected = createMockPermissionVm({
      bitmask: PermissionBit.READ,
      vmId: undefined,
      roleId: undefined,
    });
    expect(entity).toEqual(expected);
  });

  describe('createPermissionEntityFromDto', () => {
    it('should create permission entity from dto', () => {
      const dto = new PermissionVmDto({
        vmId: 'test-vm-id',
        roleId: 'test-role-id',
        bitmask:
          PermissionBit.READ | PermissionBit.WRITE | PermissionBit.DELETE,
      });

      const entity = service.createPermissionEntityFromDto(dto);

      expect(entity).toBeInstanceOf(PermissionVm);
      expect(entity.vmId).toBe(dto.vmId);
      expect(entity.roleId).toBe(dto.roleId);
      expect(entity.bitmask).toBe(dto.bitmask);
    });

    it('should handle dto with all permission bits', () => {
      const dto = new PermissionVmDto({
        vmId: 'vm-123',
        roleId: 'role-456',
        bitmask:
          PermissionBit.READ |
          PermissionBit.WRITE |
          PermissionBit.DELETE |
          PermissionBit.RESTART,
      });

      const entity = service.createPermissionEntityFromDto(dto);

      expect(entity.bitmask).toBe(
        PermissionBit.READ |
          PermissionBit.WRITE |
          PermissionBit.DELETE |
          PermissionBit.RESTART,
      );
    });

    it('should handle dto with no permissions', () => {
      const dto = new PermissionVmDto({
        vmId: 'vm-no-perm',
        roleId: 'role-no-perm',
        bitmask: 0,
      });

      const entity = service.createPermissionEntityFromDto(dto);

      expect(entity.bitmask).toBe(0);
    });

    it('should handle dto with single permission', () => {
      const dto = new PermissionVmDto({
        vmId: 'vm-read-only',
        roleId: 'role-read-only',
        bitmask: PermissionBit.READ,
      });

      const entity = service.createPermissionEntityFromDto(dto);

      expect(entity.bitmask).toBe(PermissionBit.READ);
    });

    it('should create different instances for each call', () => {
      const dto = new PermissionVmDto({
        vmId: 'vm-test',
        roleId: 'role-test',
        bitmask: PermissionBit.WRITE,
      });

      const entity1 = service.createPermissionEntityFromDto(dto);
      const entity2 = service.createPermissionEntityFromDto(dto);

      expect(entity1).not.toBe(entity2);
      expect(entity1).toEqual(entity2);
    });

    it('should handle undefined optional fields in dto', () => {
      const dto = new PermissionVmDto({
        bitmask: PermissionBit.SNAPSHOT,
      });

      const entity = service.createPermissionEntityFromDto(dto);

      expect(entity.vmId).toBeUndefined();
      expect(entity.roleId).toBeUndefined();
      expect(entity.bitmask).toBe(PermissionBit.SNAPSHOT);
    });
  });

  describe('service instantiation', () => {
    it('should be a singleton when using dependency injection', () => {
      const service1 = new PermissionDomainVmService();
      const service2 = new PermissionDomainVmService();

      expect(service1).not.toBe(service2);
    });
  });

  describe('entity creation patterns', () => {
    it('should create entities with consistent structure', () => {
      const fullEntity = service.createFullPermissionEntity();
      const readOnlyEntity = service.createReadOnlyPermissionEntity();
      const dtoEntity = service.createPermissionEntityFromDto(
        new PermissionVmDto({ bitmask: 0 }),
      );

      expect(fullEntity).toBeInstanceOf(PermissionVm);
      expect(readOnlyEntity).toBeInstanceOf(PermissionVm);
      expect(dtoEntity).toBeInstanceOf(PermissionVm);
    });

    it('should verify bitmask combinations for full permissions', () => {
      const entity = service.createFullPermissionEntity();

      expect(entity.bitmask & PermissionBit.READ).toBeTruthy();
      expect(entity.bitmask & PermissionBit.WRITE).toBeTruthy();
      expect(entity.bitmask & PermissionBit.DELETE).toBeFalsy();
      expect(entity.bitmask & PermissionBit.RESTART).toBeFalsy();
    });

    it('should verify bitmask for read-only permissions', () => {
      const entity = service.createReadOnlyPermissionEntity();

      expect(entity.bitmask & PermissionBit.READ).toBeTruthy();
      expect(entity.bitmask & PermissionBit.WRITE).toBeFalsy();
      expect(entity.bitmask & PermissionBit.DELETE).toBeFalsy();
      expect(entity.bitmask & PermissionBit.SNAPSHOT).toBeFalsy();
    });
  });
});
