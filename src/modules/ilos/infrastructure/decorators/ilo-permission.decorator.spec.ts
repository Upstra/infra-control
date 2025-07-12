import { SetMetadata } from '@nestjs/common';
import { IloPermission } from './ilo-permission.decorator';
import { IloPermissionType } from '../../domain/enums/ilo-permissions.enum';

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
    
    const decorator = IloPermission(IloPermissionType.VIEW_ILO_STATUS);
    
    expect(mockSetMetadata).toHaveBeenCalledWith('iloPermission', IloPermissionType.VIEW_ILO_STATUS);
  });

  it('should set metadata with combined permissions', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    
    const combinedPermission = IloPermissionType.VIEW_ILO_STATUS | IloPermissionType.CONTROL_ILO_POWER;
    const decorator = IloPermission(combinedPermission);
    
    expect(mockSetMetadata).toHaveBeenCalledWith('iloPermission', combinedPermission);
  });

  it('should apply the decorator to a method', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    mockSetMetadata.mockReturnValue((target: any, propertyKey: string, descriptor: any) => {
      if (!target.metadata) {
        target.metadata = {};
      }
      target.metadata['iloPermission'] = IloPermissionType.VIEW_ILO_STATUS;
      return descriptor;
    });

    class TestController {
      @IloPermission(IloPermissionType.VIEW_ILO_STATUS)
      testMethod() {
        return 'test';
      }
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('iloPermission', IloPermissionType.VIEW_ILO_STATUS);
  });

  it('should apply the decorator to a class', () => {
    const mockSetMetadata = SetMetadata as jest.Mock;
    mockSetMetadata.mockReturnValue((target: any) => {
      if (!target.metadata) {
        target.metadata = {};
      }
      target.metadata['iloPermission'] = IloPermissionType.CONTROL_ILO_POWER;
      return target;
    });

    @IloPermission(IloPermissionType.CONTROL_ILO_POWER)
    class TestController {
      testMethod() {
        return 'test';
      }
    }

    expect(mockSetMetadata).toHaveBeenCalledWith('iloPermission', IloPermissionType.CONTROL_ILO_POWER);
  });
});