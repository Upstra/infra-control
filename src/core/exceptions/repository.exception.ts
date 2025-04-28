export class InvalidQueryValueException extends Error {
  constructor(field: string, value: any) {
    super(`Invalid value '${value}' for field '${field}'`);
    this.name = 'InvalidQueryValueException';
  }
}
