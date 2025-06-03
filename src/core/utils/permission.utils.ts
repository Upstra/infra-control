import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export class PermissionUtils {
  static has(bitmask: number, bit: PermissionBit): boolean {
    return (bitmask & bit) === bit;
  }
}
