import { BadRequestException } from '@nestjs/common';
import { GroupType } from '../enums/group-type.enum';

export class GroupTypeMismatchException extends BadRequestException {
  constructor(resourceType: 'server' | 'vm', groupType: GroupType) {
    const expectedType =
      resourceType === 'server' ? GroupType.SERVER : GroupType.VM;
    super(
      `Cannot assign ${resourceType} to a group of type ${groupType}. Expected group type: ${expectedType}`,
    );
  }
}
