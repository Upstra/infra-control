export interface GroupEndpointInterface<T> {
  getAllGroups(): Promise<T[]>;
  getGroupById(id: string): Promise<T>;
  createGroup(groupDto: T): Promise<T>;
  updateGroup(id: string, groupDto: T): Promise<T>;
  deleteGroup(id: string): Promise<void>;
}
