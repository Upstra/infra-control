import { PermissionBit } from '@/modules/permissions/domain/value-objects/permission-bit.enum';

export function buildBitmask(bits: PermissionBit[]): number {
  return bits.reduce((acc, bit) => acc | bit, 0);
}
