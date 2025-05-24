import { GenericRepositoryInterface } from '@/core/types/generic-repository.interface';
import { GroupServer } from '../entities/group.server.entity';

export interface GroupServerRepositoryInterface
  extends GenericRepositoryInterface<GroupServer> {
  findGroupById(id: string): Promise<GroupServer | null>;
  createGroup(name: string, priority: number): Promise<GroupServer>;
  updateGroup(id: string, name: string, priority: number): Promise<GroupServer>;
  deleteGroup(id: string): Promise<void>;
}
