import { Group } from '../entities/group.entity';
import { GroupType } from '../enums/group-type.enum';

export interface PaginationOptions {
  page: number;
  limit: number;
  type?: GroupType;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GroupWithCounts extends Group {
  serverCount?: number;
  vmCount?: number;
}

export interface IGroupRepository {
  findAll(type?: GroupType): Promise<Group[]>;
  findAllPaginated(options: PaginationOptions): Promise<PaginatedResult<Group>>;
  findById(id: string): Promise<Group | null>;
  findByIdWithCounts(id: string): Promise<GroupWithCounts | null>;
  findByName(name: string): Promise<Group | null>;
  existsByName(name: string): Promise<boolean>;
  save(group: Group): Promise<Group>;
  delete(id: string): Promise<void>;
}
