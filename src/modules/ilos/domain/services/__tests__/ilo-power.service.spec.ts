import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IloPowerService } from '../ilo-power.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import { IloPowerAction } from '../../../application/dto/ilo-power-action.dto';
import { IloCredentialsDto } from '../../../application/dto/ilo-credentials.dto';
import { IloServerStatus } from '../../../application/dto/ilo-status.dto';

describe('IloPowerService', () => {
  let service: IloPowerService;
  let pythonExecutor: jest.Mocked<PythonExecutorService>;

  const mockCredentials: IloCredentialsDto = {
    user: 'admin',
    password: 'ilopass123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IloPowerService,
        {
          provide: PythonExecutorService,
          useValue: {
            executePython: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IloPowerService>(IloPowerService);
    pythonExecutor = module.get(PythonExecutorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('controlServerPower', () => {
    it('should start server successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        result: {
          message: 'Server has been successfully started',
          httpCode: 200,
        },
      });

      const result = await service.controlServerPower(
        '192.168.1.100',
        IloPowerAction.START,
        mockCredentials,
      );

      expect(result).toEqual({
        success: true,
        message: 'Server has been successfully started',
        currentStatus: IloServerStatus.ON,
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_start.py',
        [
          '--ip',
          '192.168.1.100',
          '--user',
          'admin',
          '--password',
          'ilopass123',
        ],
      );
    });

    it('should stop server successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        result: {
          message: 'Server has been successfully stopped',
          httpCode: 200,
        },
      });

      const result = await service.controlServerPower(
        '192.168.1.100',
        IloPowerAction.STOP,
        mockCredentials,
      );

      expect(result).toEqual({
        success: true,
        message: 'Server has been successfully stopped',
        currentStatus: IloServerStatus.OFF,
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith(
        'server_stop.py',
        [
          '--ip',
          '192.168.1.100',
          '--user',
          'admin',
          '--password',
          'ilopass123',
        ],
      );
    });

    it('should use default message when not provided', async () => {
      pythonExecutor.executePython.mockResolvedValue({});

      const result = await service.controlServerPower(
        '192.168.1.100',
        IloPowerAction.START,
        mockCredentials,
      );

      expect(result.message).toBe('Server started successfully');
    });

    it('should handle server not found error', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Server not found'),
      );

      await expect(
        service.controlServerPower(
          '192.168.1.100',
          IloPowerAction.START,
          mockCredentials,
        ),
      ).rejects.toThrow(
        new HttpException('Server not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should handle timeout error', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Operation timeout'),
      );

      await expect(
        service.controlServerPower(
          '192.168.1.100',
          IloPowerAction.START,
          mockCredentials,
        ),
      ).rejects.toThrow(
        new HttpException('Operation timeout', HttpStatus.REQUEST_TIMEOUT),
      );
    });

    it('should handle generic errors', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Unknown error'),
      );

      await expect(
        service.controlServerPower(
          '192.168.1.100',
          IloPowerAction.START,
          mockCredentials,
        ),
      ).rejects.toThrow(
        new HttpException('Unknown error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should handle error with new JSON format', async () => {
      const error: any = new Error('Action forbidden');
      error.result = {
        httpCode: 403,
        message: 'Server is in maintenance mode',
      };
      pythonExecutor.executePython.mockRejectedValue(error);

      await expect(
        service.controlServerPower(
          '192.168.1.100',
          IloPowerAction.START,
          mockCredentials,
        ),
      ).rejects.toThrow(
        new HttpException('Action forbidden', HttpStatus.FORBIDDEN),
      );
    });
  });
});
