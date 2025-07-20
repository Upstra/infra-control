import { SetMetadata } from '@nestjs/common';
import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn(),
}));

jest.mock('../../guards/ilo-permission.guard', () => ({
  ILO_PERMISSION_KEY: 'ilo_permission',
}));

describe('IloPermission Decorator', () => {
  let IloPermission: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      IloPermission = require('../ilo-permission.decorator').IloPermission;
    });
  });

  it('should call SetMetadata with correct key and permission bit', () => {
    const mockDecorator = jest.fn();
    (SetMetadata as jest.Mock).mockReturnValue(mockDecorator);

    const result = IloPermission(PermissionBit.READ);

    expect(SetMetadata).toHaveBeenCalledWith('ilo_permission', {
      requiredBit: PermissionBit.READ,
    });
    expect(result).toBe(mockDecorator);
  });

  it('should work with WRITE permission', () => {
    const mockDecorator = jest.fn();
    (SetMetadata as jest.Mock).mockReturnValue(mockDecorator);

    const result = IloPermission(PermissionBit.WRITE);

    expect(SetMetadata).toHaveBeenCalledWith('ilo_permission', {
      requiredBit: PermissionBit.WRITE,
    });
    expect(result).toBe(mockDecorator);
  });

  it('should work with SHUTDOWN permission', () => {
    const mockDecorator = jest.fn();
    (SetMetadata as jest.Mock).mockReturnValue(mockDecorator);

    const result = IloPermission(PermissionBit.SHUTDOWN);

    expect(SetMetadata).toHaveBeenCalledWith('ilo_permission', {
      requiredBit: PermissionBit.SHUTDOWN,
    });
    expect(result).toBe(mockDecorator);
  });

  it('should handle all available permission bits', () => {
    const mockDecorator = jest.fn();
    (SetMetadata as jest.Mock).mockReturnValue(mockDecorator);

    const allPermissions = Object.values(PermissionBit).filter(
      (value) => typeof value === 'number',
    );

    allPermissions.forEach((permission) => {
      IloPermission(permission as PermissionBit);
      expect(SetMetadata).toHaveBeenCalledWith('ilo_permission', {
        requiredBit: permission,
      });
    });
  });

  it('should return the result of SetMetadata', () => {
    const expectedDecorator = () => {};
    (SetMetadata as jest.Mock).mockReturnValue(expectedDecorator);

    const result = IloPermission(PermissionBit.READ);

    expect(result).toBe(expectedDecorator);
  });
});