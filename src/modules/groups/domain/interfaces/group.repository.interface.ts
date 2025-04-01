import { Group } from '../entities/group.entity';

export interface GroupRepositoryInterface {
  findAll(): Promise<Group[]>;
  findGroupById(id: number): Promise<Group | null>;
  createGroup(type: string, priority: number): Promise<Group>;
  updateGroup(id: number, type: string, priority: number): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
}
