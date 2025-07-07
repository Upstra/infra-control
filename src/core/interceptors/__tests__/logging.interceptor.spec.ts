import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor, LoggingContext } from '../logging.interceptor';
import { RequestContextDto } from '../../dto/request-context.dto';
import { LogHistoryUseCase } from '../../../modules/history/application/use-cases/log-history.use-case';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let reflector: Reflector;
  let logHistoryUseCase: jest.Mocked<LogHistoryUseCase>;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const mockRequest = {
    method: 'POST',
    originalUrl: '/api/priorities/servers/swap',
    ip: '192.168.1.1',
    get: jest.fn((header: string) => {
      if (header === 'User-Agent') return 'Test Agent';
      return undefined;
    }),
    sessionID: 'test-session-id',
    user: {
      userId: 'test-user-id',
      username: 'test-user',
    },
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler: CallHandler = {
    handle: jest.fn(),
  };

  beforeEach(async () => {
    const mockLogHistoryUseCase = {
      execute: jest.fn(),
      executeStructured: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: LogHistoryUseCase,
          useValue: mockLogHistoryUseCase,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    reflector = module.get<Reflector>(Reflector);
    logHistoryUseCase = module.get(LogHistoryUseCase);

    logSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation();
    errorSpy = jest.spyOn(interceptor['logger'], 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('when no logging context is provided', () => {
    it('should pass through without logging', (done) => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ id: 'test-id' }),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual({ id: 'test-id' });
          expect(logSpy).not.toHaveBeenCalled();
          expect(errorSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('when logging context is provided', () => {
    const loggingContext: LoggingContext = {
      entityType: 'priority',
      action: 'SWAP',
      includeRequestContext: true,
    };

    beforeEach(() => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
    });

    it('should log successful operations with request context', (done) => {
      const responseData = { id: 'result-id' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(responseData);
          expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'POST /api/priorities/servers/swap completed',
              entityType: 'priority',
              action: 'SWAP',
              userId: 'test-user-id',
              responseTime: expect.any(Number),
              requestContext: {
                ipAddress: '192.168.1.1',
                userAgent: 'Test Agent',
                sessionId: 'test-session-id',
              },
              result: 'result-id',
            }),
          );
          done();
        },
      });
    });

    it('should log successful operations without request context when disabled', (done) => {
      const contextWithoutRequest: LoggingContext = {
        entityType: 'priority',
        action: 'SWAP',
        includeRequestContext: false,
      };
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(contextWithoutRequest);

      const responseData = { id: 'result-id' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(responseData);
          expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'POST /api/priorities/servers/swap completed',
              entityType: 'priority',
              action: 'SWAP',
              userId: 'test-user-id',
              responseTime: expect.any(Number),
              result: 'result-id',
            }),
          );
          const logCall = logSpy.mock.calls[0][0];
          expect(logCall).not.toHaveProperty('requestContext');
          done();
        },
      });
    });

    it('should log errors with request context', (done) => {
      const error = new Error('Test error');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        throwError(() => error),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(errorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              message: 'POST /api/priorities/servers/swap failed',
              entityType: 'priority',
              action: 'SWAP',
              userId: 'test-user-id',
              responseTime: expect.any(Number),
              error: 'Test error',
              requestContext: {
                ipAddress: '192.168.1.1',
                userAgent: 'Test Agent',
                sessionId: 'test-session-id',
              },
            }),
          );
          done();
        },
      });
    });

    it('should handle responses without id field', (done) => {
      const responseData = { priority1: 1, priority2: 2 };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(responseData);
          expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              result: responseData,
            }),
          );
          done();
        },
      });
    });

    it('should create request context from request object', () => {
      const requestContext = RequestContextDto.fromRequest(mockRequest);

      expect(requestContext).toEqual(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          sessionId: 'test-session-id',
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle request without user', (done) => {
      const requestWithoutUser = { ...mockRequest, user: undefined };
      const contextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithoutUser),
        }),
      } as unknown as ExecutionContext;

      const loggingContext: LoggingContext = {
        entityType: 'priority',
        action: 'SWAP',
        includeRequestContext: true,
      };
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ id: 'test-id' }),
      );

      interceptor.intercept(contextWithoutUser, mockCallHandler).subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: undefined,
            }),
          );
          done();
        },
      });
    });

    it('should handle missing request headers', (done) => {
      const requestWithMissingData = {
        ...mockRequest,
        ip: undefined,
        get: jest.fn().mockReturnValue(undefined),
        sessionID: undefined,
      };
      const contextWithMissingData = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(requestWithMissingData),
        }),
      } as unknown as ExecutionContext;

      const loggingContext: LoggingContext = {
        entityType: 'priority',
        action: 'SWAP',
        includeRequestContext: true,
      };
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ id: 'test-id' }),
      );

      interceptor.intercept(contextWithMissingData, mockCallHandler).subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              requestContext: expect.objectContaining({
                ipAddress: 'unknown',
                userAgent: 'unknown',
                sessionId: undefined,
              }),
            }),
          );
          done();
        },
      });
    });
  });

  describe('logToHistory functionality', () => {
    it('should call logHistory when logToHistory is enabled', (done) => {
      const responseData = {
        id: 'vm-123',
        name: 'test-vm',
        serverId: 'server-456',
        priority: 5,
      };

      const loggingContext: LoggingContext = {
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: true,
        includeRequestContext: true,
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith({
            entity: 'vm',
            entityId: 'vm-123',
            action: 'CREATE',
            userId: 'test-user-id',
            newValue: responseData,
            metadata: {},
            ipAddress: '192.168.1.1',
            userAgent: 'Test Agent',
          });
          done();
        },
      });
    });

    it('should use custom extractEntityId when provided', (done) => {
      const responseData = {
        server1: { id: 'srv-1', name: 'Server 1' },
        server2: { id: 'srv-2', name: 'Server 2' },
      };

      const loggingContext: LoggingContext = {
        entityType: 'server-priority',
        action: 'SWAP',
        logToHistory: true,
        extractEntityId: (data) => `${data.server1.id}-${data.server2.id}`,
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
            expect.objectContaining({
              entityId: 'srv-1-srv-2',
            }),
          );
          done();
        },
      });
    });

    it('should use custom extractMetadata when provided', (done) => {
      const responseData = {
        id: 'vm-123',
        os: 'Ubuntu',
        serverId: 'server-456',
      };

      const loggingContext: LoggingContext = {
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: true,
        extractMetadata: (data) => ({
          operatingSystem: data.os,
          parentServer: data.serverId,
        }),
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(logHistoryUseCase.executeStructured).toHaveBeenCalledWith(
            expect.objectContaining({
              metadata: {
                operatingSystem: 'Ubuntu',
                parentServer: 'server-456',
              },
            }),
          );
          done();
        },
      });
    });

    it('should not call logHistory when logToHistory is false', (done) => {
      const loggingContext: LoggingContext = {
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: false,
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(
        of({ id: 'test-id' }),
      );

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should not call logHistory when entityId is missing', (done) => {
      const responseData = { name: 'test' }; // No id field

      const loggingContext: LoggingContext = {
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: true,
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(logHistoryUseCase.executeStructured).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should handle logHistory errors gracefully', (done) => {
      const responseData = { id: 'test-id' };
      const historyError = new Error('Database error');

      const loggingContext: LoggingContext = {
        entityType: 'vm',
        action: 'CREATE',
        logToHistory: true,
      };

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(loggingContext);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(responseData));
      logHistoryUseCase.executeStructured.mockRejectedValue(historyError);

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(result).toEqual(responseData);
          // Wait for async operation to complete
          setTimeout(() => {
            expect(errorSpy).toHaveBeenCalledWith(
              'Failed to log to history',
              historyError,
            );
            done();
          }, 10);
        },
      });
    });
  });
});
