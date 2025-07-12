import { PythonErrorInterceptor } from './python-error.interceptor';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('PythonErrorInterceptor', () => {
  let interceptor: PythonErrorInterceptor;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PythonErrorInterceptor],
    }).compile();

    interceptor = module.get<PythonErrorInterceptor>(PythonErrorInterceptor);

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      method: 'GET',
      url: '/test',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('catch', () => {
    it('should handle HttpException', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      interceptor.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle generic exceptions', () => {
      const exception = new Error('Generic error');

      interceptor.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Generic error',
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    describe('Python script specific errors', () => {
      it('should handle authentication errors', () => {
        const testCases = [
          'Authentication failed',
          'Error 401 occurred',
          'Authentication failed: Invalid credentials',
        ];

        testCases.forEach((message) => {
          const exception = new Error(message);

          interceptor.catch(exception, mockHost);

          expect(mockResponse.status).toHaveBeenCalledWith(
            HttpStatus.UNAUTHORIZED,
          );
          expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: HttpStatus.UNAUTHORIZED,
            message: 'Invalid credentials',
            timestamp: expect.any(String),
            path: '/test',
          });
        });
      });

      it('should handle not found errors', () => {
        const testCases = [
          'Resource not found',
          'Error 404',
          'VM not found in vCenter',
        ];

        testCases.forEach((message) => {
          const exception = new Error(message);

          interceptor.catch(exception, mockHost);

          expect(mockResponse.status).toHaveBeenCalledWith(
            HttpStatus.NOT_FOUND,
          );
          expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
            timestamp: expect.any(String),
            path: '/test',
          });
        });
      });

      it('should handle timeout errors', () => {
        const testCases = [
          'Operation timeout',
          'Request timeout exceeded',
          'Script execution timeout',
        ];

        testCases.forEach((message) => {
          const exception = new Error(message);

          interceptor.catch(exception, mockHost);

          expect(mockResponse.status).toHaveBeenCalledWith(
            HttpStatus.REQUEST_TIMEOUT,
          );
          expect(mockResponse.json).toHaveBeenCalledWith({
            statusCode: HttpStatus.REQUEST_TIMEOUT,
            message: 'Operation timeout',
            timestamp: expect.any(String),
            path: '/test',
          });
        });
      });

      it('should handle script execution errors', () => {
        const message = 'Script execution failed: Invalid parameters';
        const exception = new Error(message);

        interceptor.catch(exception, mockHost);

        expect(mockResponse.status).toHaveBeenCalledWith(
          HttpStatus.BAD_REQUEST,
        );
        expect(mockResponse.json).toHaveBeenCalledWith({
          statusCode: HttpStatus.BAD_REQUEST,
          message: message,
          timestamp: expect.any(String),
          path: '/test',
        });
      });

      it('should handle script not found as 404', () => {
        const message = 'Script execution failed: Python script not found';
        const exception = new Error(message);

        interceptor.catch(exception, mockHost);

        expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          timestamp: expect.any(String),
          path: '/test',
        });
      });
    });

    it('should handle exceptions without message', () => {
      const exception = {};

      interceptor.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should log errors', () => {
      const loggerSpy = jest
        .spyOn(interceptor['logger'], 'error')
        .mockImplementation();
      const exception = new Error('Test error');

      interceptor.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Python script error: Test error',
        exception.stack,
        'GET /test',
      );

      loggerSpy.mockRestore();
    });

    it('should include request details in error response', () => {
      const customRequest = {
        method: 'POST',
        url: '/api/vmware/power',
      };

      mockHost.switchToHttp = jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(customRequest),
      });

      const exception = new Error('Test error');

      interceptor.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Test error',
        timestamp: expect.any(String),
        path: '/api/vmware/power',
      });
    });
  });
});
