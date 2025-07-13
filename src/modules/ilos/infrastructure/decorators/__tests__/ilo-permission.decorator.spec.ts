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
    const permissionBit = PermissionBit.ILO_READ;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
    expect(SetMetadata).toHaveBeenCalledTimes(1);
  });

  it('should work with ILO_WRITE permission', () => {
    const permissionBit = PermissionBit.ILO_WRITE;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
  });

  it('should work with ILO_EXECUTE permission', () => {
    const permissionBit = PermissionBit.ILO_EXECUTE;
    
    IloPermission(permissionBit);

    expect(SetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: permissionBit });
  });

  it('should be applicable to a method', () => {
    class TestController {
      @IloPermission(PermissionBit.ILO_READ)
      testMethod() {
        return 'test';
      }
    }

    const metadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.testMethod);
    
    expect(metadata).toEqual({ requiredBit: PermissionBit.ILO_READ });
  });

  it('should be applicable to multiple methods with different permissions', () => {
    class TestController {
      @IloPermission(PermissionBit.ILO_READ)
      readMethod() {
        return 'read';
      }

      @IloPermission(PermissionBit.ILO_WRITE)
      writeMethod() {
        return 'write';
      }

      @IloPermission(PermissionBit.ILO_EXECUTE)
      executeMethod() {
        return 'execute';
      }
    }

    const readMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.readMethod);
    const writeMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.writeMethod);
    const executeMetadata = Reflect.getMetadata(ILO_PERMISSION_KEY, TestController.prototype.executeMethod);
    
    expect(readMetadata).toEqual({ requiredBit: PermissionBit.ILO_READ });
    expect(writeMetadata).toEqual({ requiredBit: PermissionBit.ILO_WRITE });
    expect(executeMetadata).toEqual({ requiredBit: PermissionBit.ILO_EXECUTE });
  });
});