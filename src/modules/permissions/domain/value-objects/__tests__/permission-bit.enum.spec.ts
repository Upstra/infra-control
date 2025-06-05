import { PermissionUtils } from '@/core/utils/index';
import { PermissionBit } from '../permission-bit.enum';

describe('PermissionBit', () => {
  it('should detect READ in a bitmask', () => {
    expect(
      PermissionUtils.has(
        PermissionBit.READ | PermissionBit.WRITE,
        PermissionBit.READ,
      ),
    ).toBe(true);
  });

  it('should not detect DELETE if only READ+WRITE', () => {
    expect(
      PermissionUtils.has(
        PermissionBit.READ | PermissionBit.WRITE,
        PermissionBit.DELETE,
      ),
    ).toBe(false);
  });
});
