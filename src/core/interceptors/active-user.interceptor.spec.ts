import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { ActiveUserInterceptor } from './active-user.interceptor';
import { InactiveUserException } from '../exceptions/inactive-user.exception';

describe('ActiveUserInterceptor', () => {
  let interceptor: ActiveUserInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActiveUserInterceptor],
    }).compile();

    interceptor = module.get<ActiveUserInterceptor>(ActiveUserInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    let mockExecutionContext: ExecutionContext;
    let mockCallHandler: CallHandler;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        user: null,
      };

      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;

      mockCallHandler = {
        handle: jest.fn().mockReturnValue(of({})),
      };
    });

    it('should allow request when user is not present', () => {
      mockRequest.user = null;

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should allow request when user is active', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        active: true,
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should throw InactiveUserException when user is inactive', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        active: false,
      };

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(InactiveUserException);

      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should allow request when user.active is undefined', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
      };

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should handle nested user object correctly', () => {
      mockRequest.user = {
        userId: '123',
        email: 'test@example.com',
        active: false,
        role: {
          name: 'admin',
          permissions: [],
        },
      };

      expect(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler);
      }).toThrow(InactiveUserException);

      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });
  });
});
