import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor, LoggingContext } from '../logging.interceptor';
import { RequestContextDto } from '../../dto/request-context.dto';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let reflector: Reflector;
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

  const mockCallHandler = {
    handle: jest.fn(),
  } as CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    reflector = module.get<Reflector>(Reflector);
    
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
      mockCallHandler.handle.mockReturnValue(of({ id: 'test-id' }));

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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(loggingContext);
    });

    it('should log successful operations with request context', (done) => {
      const responseData = { id: 'result-id' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(contextWithoutRequest);
      
      const responseData = { id: 'result-id' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

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
          expect(logSpy).toHaveBeenCalledWith(
            expect.not.objectContaining({
              requestContext: expect.any(Object),
            }),
          );
          done();
        },
      });
    });

    it('should log errors with request context', (done) => {
      const error = new Error('Test error');
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

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
      mockCallHandler.handle.mockReturnValue(of(responseData));

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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(loggingContext);
      mockCallHandler.handle.mockReturnValue(of({ id: 'test-id' }));

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
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(loggingContext);
      mockCallHandler.handle.mockReturnValue(of({ id: 'test-id' }));

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
});