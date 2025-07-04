import { GroupNotFoundException } from '../group.exception';

describe('GroupNotFoundException', () => {
  describe('constructor', () => {
    it('should create exception with default message when no parameters provided', () => {
      const exception = new GroupNotFoundException();

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(GroupNotFoundException);
      expect(exception.message).toBe('Group not found');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should create exception with server type and id', () => {
      const exception = new GroupNotFoundException('server', '123');

      expect(exception.message).toBe('Group server not found (id=123)');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should create exception with vm type and id', () => {
      const exception = new GroupNotFoundException('vm', '456');

      expect(exception.message).toBe('Group vm not found (id=456)');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should create exception with type but no id', () => {
      const exception = new GroupNotFoundException('server');

      expect(exception.message).toBe('Group not found');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should create exception with id but no type', () => {
      const exception = new GroupNotFoundException(undefined, '789');

      expect(exception.message).toBe('Group undefined not found (id=789)');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should handle empty string id', () => {
      const exception = new GroupNotFoundException('vm', '');

      expect(exception.message).toBe('Group not found');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should handle long ids', () => {
      const longId = 'a'.repeat(100);
      const exception = new GroupNotFoundException('server', longId);

      expect(exception.message).toBe(`Group server not found (id=${longId})`);
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should be throwable', () => {
      const throwException = () => {
        throw new GroupNotFoundException('vm', '123');
      };

      expect(throwException).toThrow(GroupNotFoundException);
      expect(throwException).toThrow('Group vm not found (id=123)');
    });

    it('should maintain proper prototype chain', () => {
      const exception = new GroupNotFoundException();

      expect(exception instanceof GroupNotFoundException).toBe(true);
      expect(exception instanceof Error).toBe(true);
      expect(Object.getPrototypeOf(exception)).toBe(
        GroupNotFoundException.prototype,
      );
    });

    it('should have correct stack trace', () => {
      const exception = new GroupNotFoundException('server', '999');

      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('GroupNotFoundException');
      expect(exception.stack).toContain('group.exception.spec.ts');
    });

    it('should work with error handling mechanisms', () => {
      let caughtError: Error | null = null;

      try {
        throw new GroupNotFoundException('vm', 'test-id');
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).toBeInstanceOf(GroupNotFoundException);
      expect(caughtError?.message).toBe('Group vm not found (id=test-id)');
    });

    it('should handle special characters in id', () => {
      const specialId = 'id-with-special-chars!@#$%^&*()';
      const exception = new GroupNotFoundException('server', specialId);

      expect(exception.message).toBe(
        `Group server not found (id=${specialId})`,
      );
    });

    it('should handle null values gracefully', () => {
      const exception = new GroupNotFoundException(null as any, null as any);

      expect(exception.message).toBe('Group not found');
      expect(exception.name).toBe('GroupNotFoundException');
    });

    it('should handle undefined values correctly', () => {
      const exception = new GroupNotFoundException(undefined, undefined);

      expect(exception.message).toBe('Group not found');
      expect(exception.name).toBe('GroupNotFoundException');
    });
  });

  describe('usage patterns', () => {
    it('should work in async/await context', async () => {
      const asyncFunction = async () => {
        throw new GroupNotFoundException('server', 'async-123');
      };

      await expect(asyncFunction()).rejects.toThrow(GroupNotFoundException);
      await expect(asyncFunction()).rejects.toThrow(
        'Group server not found (id=async-123)',
      );
    });

    it('should work with Promise rejection', () => {
      const promise = Promise.reject(
        new GroupNotFoundException('vm', 'promise-456'),
      );

      return expect(promise).rejects.toThrow(GroupNotFoundException);
    });

    it('should be catchable by type', () => {
      let specificError: GroupNotFoundException | null = null;
      let genericError: Error | null = null;

      try {
        throw new GroupNotFoundException('server', 'catch-test');
      } catch (error) {
        if (error instanceof GroupNotFoundException) {
          specificError = error;
        } else if (error instanceof Error) {
          genericError = error;
        }
      }

      expect(specificError).toBeInstanceOf(GroupNotFoundException);
      expect(specificError?.message).toBe(
        'Group server not found (id=catch-test)',
      );
      expect(genericError).toBeNull();
    });
  });
});
