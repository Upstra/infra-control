import 'reflect-metadata';
import { UseLoggingContext, LogToHistory } from '../logging-context.decorator';
import { LOGGING_CONTEXT_KEY } from '../../interceptors/logging.interceptor';

describe('Logging Context Decorators', () => {
  describe('UseLoggingContext', () => {
    it('should set metadata with provided context', () => {
      const context = {
        entityType: 'test-entity',
        action: 'CREATE',
        includeRequestContext: true,
      };

      class TestClass {
        @UseLoggingContext(context)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual(context);
    });

    it('should set metadata on class level', () => {
      const context = {
        entityType: 'test-entity',
        action: 'UPDATE',
      };

      @UseLoggingContext(context)
      class TestClass {
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(LOGGING_CONTEXT_KEY, TestClass);

      expect(metadata).toEqual(context);
    });
  });

  describe('LogToHistory', () => {
    it('should create logging context with logToHistory enabled', () => {
      class TestClass {
        @LogToHistory('vm', 'CREATE')
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual({
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: true,
        includeRequestContext: true,
      });
    });

    it('should include custom extractors when provided', () => {
      const extractEntityId = (data: any) => data.customId;
      const extractMetadata = (data: any) => ({ custom: data.value });

      class TestClass {
        @LogToHistory('server', 'UPDATE', {
          extractEntityId,
          extractMetadata,
        })
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual({
        entityType: 'server',
        action: 'UPDATE',
        logToHistory: true,
        includeRequestContext: true,
        extractEntityId,
        extractMetadata,
      });
    });

    it('should allow partial options', () => {
      const extractEntityId = (data: any) => `${data.id1}-${data.id2}`;

      class TestClass {
        @LogToHistory('priority', 'SWAP', { extractEntityId })
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual({
        entityType: 'priority',
        action: 'SWAP',
        logToHistory: true,
        includeRequestContext: true,
        extractEntityId,
      });
    });

    it('should work without options', () => {
      class TestClass {
        @LogToHistory('user', 'DELETE')
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual({
        entityType: 'user',
        action: 'DELETE',
        logToHistory: true,
        includeRequestContext: true,
      });
    });

    it('should override properties when spread with options', () => {
      const options = {
        extractMetadata: (_data: any) => ({ test: true }),
        includeRequestContext: false,
      };

      class TestClass {
        @LogToHistory('room', 'CREATE', options)
        testMethod() {}
      }

      const metadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.testMethod,
      );

      expect(metadata).toEqual({
        entityType: 'room',
        action: 'CREATE',
        logToHistory: true,
        includeRequestContext: false,
        extractMetadata: options.extractMetadata,
      });
    });
  });

  describe('Integration', () => {
    it('should allow multiple decorators on same class', () => {
      class TestClass {
        @UseLoggingContext({ entityType: 'user', action: 'LIST' })
        listUsers() {}

        @LogToHistory('user', 'CREATE')
        createUser() {}

        @LogToHistory('user', 'UPDATE', {
          extractEntityId: (data) => data.userId,
        })
        updateUser() {}
      }

      const listMetadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.listUsers,
      );
      const createMetadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.createUser,
      );
      const updateMetadata = Reflect.getMetadata(
        LOGGING_CONTEXT_KEY,
        TestClass.prototype.updateUser,
      );

      expect(listMetadata).toEqual({
        entityType: 'user',
        action: 'LIST',
      });

      expect(createMetadata).toEqual({
        entityType: 'user',
        action: 'CREATE',
        logToHistory: true,
        includeRequestContext: true,
      });

      expect(updateMetadata).toEqual({
        entityType: 'user',
        action: 'UPDATE',
        logToHistory: true,
        includeRequestContext: true,
        extractEntityId: expect.any(Function),
      });
    });
  });
});
