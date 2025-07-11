import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IloPowerService } from '../ilo-power.service';
import { PythonExecutorService } from '@/core/services/python-executor';
import {
  IloCredentialsDto,
  IloPowerAction,
} from '../../../application/dto/ilo-power-action.dto';
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

  describe('getServerStatus', () => {
    it('should return server ON status', async () => {
      pythonExecutor.executePython.mockResolvedValue('ON');

      const result = await service.getServerStatus(
        '192.168.1.100',
        mockCredentials,
      );

      expect(result).toBe(IloServerStatus.ON);
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('ilo.py', [
        '--ip',
        '192.168.1.100',
        '--user',
        'admin',
        '--password',
        'ilopass123',
        '--status',
      ]);
    });

    it('should return server OFF status', async () => {
      pythonExecutor.executePython.mockResolvedValue('OFF');

      const result = await service.getServerStatus(
        '192.168.1.100',
        mockCredentials,
      );

      expect(result).toBe(IloServerStatus.OFF);
    });

    it('should return ERROR status for unknown response', async () => {
      pythonExecutor.executePython.mockResolvedValue('UNKNOWN');

      const result = await service.getServerStatus(
        '192.168.1.100',
        mockCredentials,
      );

      expect(result).toBe(IloServerStatus.ERROR);
    });

    it('should handle status in object format', async () => {
      pythonExecutor.executePython.mockResolvedValue({ status: 'PoweredOn' });

      const result = await service.getServerStatus(
        '192.168.1.100',
        mockCredentials,
      );

      expect(result).toBe(IloServerStatus.ON);
    });

    it('should handle authentication errors', async () => {
      pythonExecutor.executePython.mockRejectedValue(
        new Error('Authentication failed'),
      );

      await expect(
        service.getServerStatus('192.168.1.100', mockCredentials),
      ).rejects.toThrow(
        new HttpException('Invalid iLO credentials', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('controlServerPower', () => {
    it('should start server successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        message: 'Server started successfully',
        status: 'ON',
      });

      const result = await service.controlServerPower(
        '192.168.1.100',
        IloPowerAction.START,
        mockCredentials,
      );

      expect(result).toEqual({
        success: true,
        message: 'Server started successfully',
        currentStatus: IloServerStatus.ON,
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('ilo.py', [
        '--ip',
        '192.168.1.100',
        '--user',
        'admin',
        '--password',
        'ilopass123',
        '--start',
      ]);
    });

    it('should stop server successfully', async () => {
      pythonExecutor.executePython.mockResolvedValue({
        message: 'Server stopped successfully',
        status: 'OFF',
      });

      const result = await service.controlServerPower(
        '192.168.1.100',
        IloPowerAction.STOP,
        mockCredentials,
      );

      expect(result).toEqual({
        success: true,
        message: 'Server stopped successfully',
        currentStatus: IloServerStatus.OFF,
      });
      expect(pythonExecutor.executePython).toHaveBeenCalledWith('ilo.py', [
        '--ip',
        '192.168.1.100',
        '--user',
        'admin',
        '--password',
        'ilopass123',
        '--stop',
      ]);
    });

    it('should use default message when not provided', async () => {
      pythonExecutor.executePython.mockResolvedValue('ON');

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
  });
});
