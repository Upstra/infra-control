import { ArgumentsHost } from '@nestjs/common';
import { SystemSettingsExceptionFilter } from '../system-settings-exception.filter';
import {
  SystemSettingsNotFoundException,
  InvalidSettingsCategoryException,
  EmailConfigurationException,
  SettingsImportException,
} from '../../../domain/exceptions/system-settings.exceptions';

describe('SystemSettingsExceptionFilter', () => {
  let filter: SystemSettingsExceptionFilter;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new SystemSettingsExceptionFilter();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockHttpContext = {
      getResponse: jest.fn().mockReturnValue(mockResponse),
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
    } as any;
  });

  describe('catch', () => {
    it('should handle SystemSettingsNotFoundException with 404 status', () => {
      const exception = new SystemSettingsNotFoundException();
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: 'System settings not found',
        error: 'SystemSettingsNotFoundException',
        timestamp: expect.any(String),
      });
    });

    it('should handle InvalidSettingsCategoryException with 400 status', () => {
      const exception = new InvalidSettingsCategoryException('invalid');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Invalid settings category: invalid',
        error: 'InvalidSettingsCategoryException',
        timestamp: expect.any(String),
      });
    });

    it('should handle EmailConfigurationException with 400 status', () => {
      const exception = new EmailConfigurationException('SMTP error');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Email configuration error: SMTP error',
        error: 'EmailConfigurationException',
        timestamp: expect.any(String),
      });
    });

    it('should handle SettingsImportException with 400 status', () => {
      const exception = new SettingsImportException('Invalid format');
      
      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: 'Settings import failed: Invalid format',
        error: 'SettingsImportException',
        timestamp: expect.any(String),
      });
    });

    it('should return ISO timestamp', () => {
      const exception = new EmailConfigurationException('test');
      const beforeTime = new Date().toISOString();
      
      filter.catch(exception, mockHost);
      
      const afterTime = new Date().toISOString();
      const responseCall = mockResponse.json.mock.calls[0][0];
      
      expect(new Date(responseCall.timestamp).toISOString()).toEqual(responseCall.timestamp);
      expect(responseCall.timestamp >= beforeTime).toBe(true);
      expect(responseCall.timestamp <= afterTime).toBe(true);
    });
  });
});