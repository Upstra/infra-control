export class VmConflictException extends Error {
  constructor(ip: string) {
    super(`ip address ${ip} already exists`);
    this.name = 'VmConfilctException';
  }
}
