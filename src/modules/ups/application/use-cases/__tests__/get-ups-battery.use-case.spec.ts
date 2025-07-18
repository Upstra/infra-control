import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { GetUpsBatteryUseCase } from '../get-ups-battery.use-case';
import { PythonExecutorService } from '@/core/services/python-executor';
import { UpsRepositoryInterface } from '../../../domain/interfaces/ups.repository.interface';
import { UpsBatteryDomainService } from '../../../domain/services/ups-battery.domain.service';
import { UpsNotFoundException } from '../../../domain/exceptions/ups.exception';
import { UpsBatteryEvents } from '../../../domain/events/ups-battery.events';

describe('GetUpsBatteryUseCase', () => {
  let useCase: GetUpsBatteryUseCase;
  let pythonExecutor: PythonExecutorService;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let upsRepository: jest.Mocked<UpsRepositoryInterface>;
  let upsBatteryDomainService: UpsBatteryDomainService;

  const mockUps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    ip: '192.168.1.100',
    name: 'UPS-1',
    grace_period_on: 60,
    grace_period_off: 60,
    roomId: 'room-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUpsBatteryUseCase,
        UpsBatteryDomainService,
        {
          provide: PythonExecutorService,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetUpsBatteryUseCase>(GetUpsBatteryUseCase);
    pythonExecutor = module.get(PythonExecutorService);
    eventEmitter = module.get(EventEmitter2);
    upsRepository = module.get('UpsRepositoryInterface');
    upsBatteryDomainService = module.get(UpsBatteryDomainService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return battery status for valid UPS with normal level', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '120',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result).toMatchObject({
        upsId: mockUps.id,
        ip: mockUps.ip,
        minutesRemaining: 120,
        hoursRemaining: 2,
        alertLevel: 'normal',
        statusLabel: 'Normal',
        timestamp: expect.any(Date),
      });

      expect(upsRepository.findById).toHaveBeenCalledWith(mockUps.id);
      expect(pythonExecutor.execute).toHaveBeenCalledWith('ups_battery.sh', [
        '--ip',
        mockUps.ip,
      ]);
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UpsBatteryEvents.BATTERY_CHECKED,
        expect.any(Object)
      );
    });

    it('should emit alert event for low battery level', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '25',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result.alertLevel).toBe('low');
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UpsBatteryEvents.BATTERY_ALERT,
        expect.objectContaining({
          upsId: mockUps.id,
          upsName: mockUps.name,
          status: expect.objectContaining({
            alertLevel: 'low',
            minutesRemaining: 25,
          }),
        })
      );
    });

    it('should emit alert event for warning battery level', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '10',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result.alertLevel).toBe('warning');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        UpsBatteryEvents.BATTERY_ALERT,
        expect.objectContaining({
          status: expect.objectContaining({
            alertLevel: 'warning',
          }),
        })
      );
    });

    it('should emit alert event for critical battery level', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '3',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result.alertLevel).toBe('critical');
      expect(result.statusLabel).toBe('Critique - Action immédiate requise');
    });

    it('should throw UpsNotFoundException when UPS not found', async () => {
      upsRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute('invalid-id')).rejects.toThrow(
        UpsNotFoundException
      );

      expect(pythonExecutor.execute).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid battery value', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: 'invalid',
      } as any);

      await expect(useCase.execute(mockUps.id)).rejects.toThrow(
        BadRequestException
      );
      await expect(useCase.execute(mockUps.id)).rejects.toThrow(
        'Invalid battery minutes value'
      );
    });

    it('should throw BadRequestException when python script fails', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'error',
        message: 'Script execution failed',
      } as any);

      await expect(useCase.execute(mockUps.id)).rejects.toThrow(
        BadRequestException
      );
      await expect(useCase.execute(mockUps.id)).rejects.toThrow(
        'Script execution failed'
      );
    });

    it('should handle edge case battery values correctly', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      
      // Test threshold boundaries
      const testCases = [
        { minutes: 5, expectedLevel: 'critical' },
        { minutes: 6, expectedLevel: 'warning' },
        { minutes: 15, expectedLevel: 'warning' },
        { minutes: 16, expectedLevel: 'low' },
        { minutes: 30, expectedLevel: 'low' },
        { minutes: 31, expectedLevel: 'normal' },
      ];

      for (const testCase of testCases) {
        jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
          status: 'success',
          output: testCase.minutes.toString(),
        } as any);

        const result = await useCase.execute(mockUps.id);
        expect(result.alertLevel).toBe(testCase.expectedLevel);
      }
    });

    it('should calculate hours remaining correctly', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '90',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result.hoursRemaining).toBe(1.5);
    });

    it('should handle empty output from python script', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '',
      } as any);

      await expect(useCase.execute(mockUps.id)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle output with whitespace', async () => {
      upsRepository.findById.mockResolvedValue(mockUps);
      jest.spyOn(pythonExecutor, 'execute').mockResolvedValue({
        status: 'success',
        output: '  45  \n',
      } as any);

      const result = await useCase.execute(mockUps.id);

      expect(result.minutesRemaining).toBe(45);
    });
  });
});