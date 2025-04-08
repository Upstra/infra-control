export class UpsConfilctException extends Error {
  constructor(ip: string) {
    super(`ip address ${ip} already exists`);
    this.name = 'UpsConfilctException';
  }
}
