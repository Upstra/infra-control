import { InvalidQueryValueException } from '../repository.exception';
describe('RepositoryException', () => {
  it('should create an exception with correct message', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err).toBeInstanceOf(InvalidQueryValueException);
    expect(err.message).toBe("Invalid value 'value' for field 'field'");

    expect(err.name).toBe('InvalidQueryValueException');
  });

  it('should have a custom name', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err.name).toBe('InvalidQueryValueException');
  });

  it('should have a stack trace', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('InvalidQueryValueException');
  });

  it('should be an instance of Error', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err).toBeInstanceOf(Error);
  });

  it('should be an instance of InvalidQueryValueException', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err).toBeInstanceOf(InvalidQueryValueException);
  });

  it('should have a message that includes field and value', () => {
    const err = new InvalidQueryValueException('field', 'value');
    expect(err.message).toContain('field');
    expect(err.message).toContain('value');
  });
});
