import { Group } from '../entities/group.entity';

export interface GroupRepositoryInterface {
  save(group: Group): Promise<Group>;
  findAll(): Promise<Group[]>;
  findGroupById(id: string): Promise<Group | null>;
  createGroup(type: string, priority: number): Promise<Group>;
  updateGroup(id: string, type: string, priority: number): Promise<Group>;
  deleteGroup(id: string): Promise<void>;
}
