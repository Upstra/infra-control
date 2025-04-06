import { GroupDtoInterface } from './group.dto.interface';

export interface GroupServiceInterface {
  getAllGroups(): Promise<GroupDtoInterface[]>;
  getGroupById(id: string): Promise<GroupDtoInterface>;
  createGroup(groupDto: GroupDtoInterface): Promise<GroupDtoInterface>;
  updateGroup(
    id: string,
    groupDto: GroupDtoInterface,
  ): Promise<GroupDtoInterface>;
  deleteGroup(id: string): Promise<void>;
}
