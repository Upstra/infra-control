import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { PythonErrorInterceptor } from './python-error.interceptor';

describe('PythonErrorInterceptor', () => {
  let interceptor: PythonErrorInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PythonErrorInterceptor],
    }).compile();

    interceptor = module.get<PythonErrorInterceptor>(PythonErrorInterceptor);
  });

  const createMockExecutionContext = (): ExecutionContext => ({
    switchToHttp: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToGraphQL: jest.fn(),
  } as any);

  const createMockCallHandler = (error?: any): CallHandler => ({
    handle: jest.fn().mockReturnValue(
      error ? throwError(() => error) : of('success'),
    ),
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should pass through successful responses', (done) => {
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler();

    interceptor.intercept(context, callHandler).subscribe({
      next: (result) => {
        expect(result).toBe('success');
        done();
      },
    });
  });

  it('should pass through existing HttpExceptions', (done) => {
    const httpException = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);
    const context = createMockExecutionContext();
    const callHandler = createMockCallHandler(httpException);

    interceptor.intercept(context, callHandler).subscribe({
      error: (error) => {
        expect(error).toBe(httpException);
        expect(error).toBeInstanceOf(HttpException);
        done();
      },
    });
  });

  describe('Python error message mapping', () => {
    it('should map authentication errors to 401', (done) => {
      const authErrors = [
        'Authentication failed',
        'authentication failed for user',
        'Invalid credentials for authentication',
      ];

      const testAuthError = (message: string, done: jest.DoneCallback) => {
        const error = new Error(message);
        const context = createMockExecutionContext();
        const callHandler = createMockCallHandler(error);

        interceptor.intercept(context, callHandler).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
            expect(error.getResponse()).toEqual({
              statusCode: HttpStatus.UNAUTHORIZED,
              message,
              error: 'Unauthorized',
            });
            done();
          },
        });
      };

      authErrors.forEach((message, index) => {
        if (index === authErrors.length - 1) {
          testAuthError(message, done);
        } else {
          testAuthError(message, jest.fn());
        }
      });
    });

    it('should map not found errors to 404', (done) => {
      const notFoundErrors = [
        'VM not found',
        'Server not found with ID 123',
        'Resource not found in database',
        'File not found: /path/to/file',
      ];

      const testNotFoundError = (message: string, done: jest.DoneCallback) => {
        const error = new Error(message);
        const context = createMockExecutionContext();
        const callHandler = createMockCallHandler(error);

        interceptor.intercept(context, callHandler).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect(error.getResponse()).toEqual({
              statusCode: HttpStatus.NOT_FOUND,
              message,
              error: 'Not Found',
            });
            done();
          },
        });
      };

      notFoundErrors.forEach((message, index) => {
        if (index === notFoundErrors.length - 1) {
          testNotFoundError(message, done);
        } else {
          testNotFoundError(message, jest.fn());
        }
      });
    });

    it('should map timeout errors to 408', (done) => {
      const timeoutErrors = [
        'Script execution timeout',
        'Operation timeout after 30 seconds',
        'Request timeout exceeded',
      ];

      const testTimeoutError = (message: string, done: jest.DoneCallback) => {
        const error = new Error(message);
        const context = createMockExecutionContext();
        const callHandler = createMockCallHandler(error);

        interceptor.intercept(context, callHandler).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(HttpStatus.REQUEST_TIMEOUT);
            expect(error.getResponse()).toEqual({
              statusCode: HttpStatus.REQUEST_TIMEOUT,
              message,
              error: 'Request Timeout',
            });
            done();
          },
        });
      };

      timeoutErrors.forEach((message, index) => {
        if (index === timeoutErrors.length - 1) {
          testTimeoutError(message, done);
        } else {
          testTimeoutError(message, jest.fn());
        }
      });
    });

    it('should map script execution failures to 502', (done) => {
      const scriptErrors = [
        'Script execution failed',
        'Python script execution failed with exit code 1',
        'Failed to execute script: /path/to/script.py',
      ];

      const testScriptError = (message: string, done: jest.DoneCallback) => {
        const error = new Error(message);
        const context = createMockExecutionContext();
        const callHandler = createMockCallHandler(error);

        interceptor.intercept(context, callHandler).subscribe({
          error: (error) => {
            expect(error).toBeInstanceOf(HttpException);
            expect(error.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
            expect(error.getResponse()).toEqual({
              statusCode: HttpStatus.BAD_GATEWAY,
              message,
              error: 'Bad Gateway',
            });
            done();
          },
        });
      };

      scriptErrors.forEach((message, index) => {
        if (index === scriptErrors.length - 1) {
          testScriptError(message, done);
        } else {
          testScriptError(message, jest.fn());
        }
      });
    });

    it('should map generic errors to 500', (done) => {
      const genericError = new Error('Something went wrong');
      const context = createMockExecutionContext();
      const callHandler = createMockCallHandler(genericError);

      interceptor.intercept(context, callHandler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          expect(error.getResponse()).toEqual({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Something went wrong',
            error: 'Internal Server Error',
          });
          done();
        },
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle errors without message property', (done) => {
      const errorWithoutMessage = { code: 'ERROR_CODE' };
      const context = createMockExecutionContext();
      const callHandler = createMockCallHandler(errorWithoutMessage);

      interceptor.intercept(context, callHandler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          done();
        },
      });
    });

    it('should handle null or undefined errors', (done) => {
      const context = createMockExecutionContext();
      const callHandler = createMockCallHandler(null);

      interceptor.intercept(context, callHandler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
          done();
        },
      });
    });

    it('should preserve stack trace when available', (done) => {
      const errorWithStack = new Error('Test error');
      errorWithStack.stack = 'Error: Test error\n    at TestFile.js:10:5';
      
      const context = createMockExecutionContext();
      const callHandler = createMockCallHandler(errorWithStack);

      interceptor.intercept(context, callHandler).subscribe({
        error: (error) => {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.stack).toBeDefined();
          done();
        },
      });
    });
  });
});