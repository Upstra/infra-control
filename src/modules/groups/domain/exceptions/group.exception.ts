export class GroupNotFoundException extends Error {
  constructor(type?: 'server' | 'vm', id?: string) {
    super(id ? `Group ${type} not found (id=${id})` : 'Group not found');
    this.name = 'GroupNotFoundException';
  }
}
