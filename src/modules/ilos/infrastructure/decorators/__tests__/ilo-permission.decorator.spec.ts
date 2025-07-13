import { IloPermission } from '../ilo-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ILO_PERMISSION_KEY } from '../../guards/ilo-permission.guard';
import { SetMetadata } from '@nestjs/common';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn((key, value) => {
    return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
      Reflect.defineMetadata(key, value, descriptor?.value ?? target);
    };
  }),
}));

describe('IloPermission Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call SetMetadata with correct key and permission bit', () => {
    const permissionBit = PermissionBit.READ;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
    expect(SetMetadata).toHaveBeenCalledTimes(1);
  });

  it('should work with WRITE permission', () => {
    const permissionBit = PermissionBit.WRITE;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
  });

  it('should work with SHUTDOWN permission', () => {
    const permissionBit = PermissionBit.SHUTDOWN;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
  });

  it('should be applicable to a method', () => {
    class TestController {
      @IloPermission(PermissionBit.READ)
      testMethod() {
        return 'test';
      }
    }

    const metadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.testMethod);
    
    expect(metadata).toEqual({ requiredBit: PermissionBit.READ });
  });

  it('should be applicable to multiple methods with different permissions', () => {
    class TestController {
      @IloPermission(PermissionBit.READ)
      readMethod() {
        return 'read';
      }

      @IloPermission(PermissionBit.WRITE)
      writeMethod() {
        return 'write';
      }

      @IloPermission(PermissionBit.SHUTDOWN)
      executeMethod() {
        return 'execute';
      }
    }

    const readMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.readMethod);
    const writeMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.writeMethod);
    const executeMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.executeMethod);
    
    expect(readMetadata).toEqual({ requiredBit: PermissionBit.READ });
    expect(writeMetadata).toEqual({ requiredBit: PermissionBit.WRITE });
    expect(executeMetadata).toEqual({ requiredBit: PermissionBit.SHUTDOWN });
  });
});