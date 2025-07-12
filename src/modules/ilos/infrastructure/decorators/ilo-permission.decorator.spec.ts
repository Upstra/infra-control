import { SetMetadata } from '@nestjs/common';
import { IloPermission } from './ilo-permission.decorator';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';
import { ILO_PERMISSION_KEY } from '../guards/ilo-permission.guard';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn().mockImplementation((key, value) => {
    return (target: any, propertyKey?: string, descriptor?: any) => {
      if (!target.metadata) {
        target.metadata = {};
      }
      target.metadata[key] = value;
      return descriptor ? descriptor : target;
    };
  }),
}));

describe('IloPermission Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set metadata with single permission', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    
    const decorator = IloPermission(PermissionBit.READ);
    
    expect(mockSetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: PermissionBit.READ });
  });

  it('should set metadata with write permission', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    
    const decorator = IloPermission(PermissionBit.WRITE);
    
    expect(mockSetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: PermissionBit.WRITE });
  });

  it('should apply the decorator to a method', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    mockSetMetadata.mockReturnValue((target: any, propertyKey: string, descriptor: any) => {
      if (!target.metadata) {
        target.metadata = {};
      }
      target.metadata[ILO_PERMISSION_KEY] = { requiredBit: PermissionBit.READ };
      return descriptor;
    });

    class TestController {
      @IloPermission(PermissionBit.READ)
      testMethod() {
        return 'test';
      }
    }

    expect(mockSetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: PermissionBit.READ });
  });

  it('should apply the decorator to a class', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    mockSetMetadata.mockReturnValue((target: any) => {
      if (!target.metadata) {
        target.metadata = {};
      }
      target.metadata[ILO_PERMISSION_KEY] = { requiredBit: PermissionBit.WRITE };
      return target;
    });

    @IloPermission(PermissionBit.WRITE)
    class TestController {
      testMethod() {
        return 'test';
      }
    }

    expect(mockSetMetadata).toHaveBeenCalledWith(ILO_PERMISSION_KEY, { requiredBit: PermissionBit.WRITE });
  });
});