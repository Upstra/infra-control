import { Test, TestingModule } from '@nestjs/testing';
import { GetSetupProgressEnhancedUseCase } from '../get-setup-progress-enhanced.use-case';
import { RoomRepositoryInterface } from '../../../../rooms/domain/interfaces/room.repository.interface';
import { UpsRepositoryInterface } from '../../../../ups/domain/interfaces/ups.repository.interface';
import { ServerRepositoryInterface } from '../../../../servers/domain/interfaces/server.repository.interface';
import { SetupProgressRepositoryInterface } from '../../../domain/interfaces/setup.repository.interface';
import { SetupStep } from '../../dto';
import { SetupProgress } from '../../../domain/entities/setup-progress.entity';

describe('GetSetupProgressEnhancedUseCase', () => {
  let useCase: GetSetupProgressEnhancedUseCase;
  let roomRepository: RoomRepositoryInterface;
  let upsRepository: UpsRepositoryInterface;
  let serverRepository: ServerRepositoryInterface;
  let setupProgressRepository: SetupProgressRepositoryInterface;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSetupProgressEnhancedUseCase,
        {
          provide: 'RoomRepositoryInterface',
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: 'SetupProgressRepositoryInterface',
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetSetupProgressEnhancedUseCase>(
      GetSetupProgressEnhancedUseCase,
    );
    roomRepository = module.get<RoomRepositoryInterface>(
      'RoomRepositoryInterface',
    );
    upsRepository = module.get<UpsRepositoryInterface>(
      'UpsRepositoryInterface',
    );
    serverRepository = module.get<ServerRepositoryInterface>(
      'ServerRepositoryInterface',
    );
    setupProgressRepository = module.get<SetupProgressRepositoryInterface>(
      'SetupProgressRepositoryInterface',
    );
  });

  describe('execute', () => {
    it('should return enhanced progress with resource counts', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(3);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(5);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(10);
      jest.spyOn(setupProgressRepository, 'findAll').mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.resourceCounts).toEqual({
        rooms: 3,
        ups: 5,
        servers: 10,
      });
    });

    it('should calculate progress percentage correctly', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(0);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(0);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(0);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.WELCOME,
          completedAt: new Date('2024-01-01'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.RESOURCE_PLANNING,
          completedAt: new Date('2024-01-02'),
          completedBy: 'user1',
        },
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      // Progress: 2 completed out of 8 steps (0-7 indices)
      expect(result.currentStep).toBe(SetupStep.ROOMS_CONFIG);
      expect(result.completedSteps).toEqual([
        SetupStep.WELCOME,
        SetupStep.RESOURCE_PLANNING,
      ]);
      expect(result.totalSteps).toBe(8);
      expect(result.percentComplete).toBe(25); // 2/8 * 100
    });

    it('should detect when setup is complete', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(1);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(1);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(1);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.WELCOME,
          completedAt: new Date('2024-01-01'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.RESOURCE_PLANNING,
          completedAt: new Date('2024-01-02'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.ROOMS_CONFIG,
          completedAt: new Date('2024-01-03'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.UPS_CONFIG,
          completedAt: new Date('2024-01-04'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.SERVERS_CONFIG,
          completedAt: new Date('2024-01-05'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.RELATIONSHIPS,
          completedAt: new Date('2024-01-06'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.REVIEW,
          completedAt: new Date('2024-01-07'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.COMPLETE,
          completedAt: new Date('2024-01-08'),
          completedBy: 'user1',
        },
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      expect(result.currentStep).toBe(SetupStep.COMPLETE);
      expect(result.isCompleted).toBe(true);
      expect(result.percentComplete).toBe(100);
    });

    it('should allow skipping to review when resources exist', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(2);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(3);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(5);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.WELCOME,
          completedAt: new Date('2024-01-01'),
          completedBy: 'user1',
        },
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      expect(result.canSkipToReview).toBe(true);
    });

    it('should not allow skipping to review when resources missing', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(2);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(0); // No UPS
      jest.spyOn(serverRepository, 'count').mockResolvedValue(5);

      jest.spyOn(setupProgressRepository, 'findAll').mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.canSkipToReview).toBe(false);
    });

    it('should not allow skipping to review if already reviewed', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(2);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(3);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(5);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.REVIEW,
          completedAt: new Date('2024-01-01'),
          completedBy: 'user1',
        },
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      expect(result.canSkipToReview).toBe(false);
    });

    it('should skip resource steps if resources already exist', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(1);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(1);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(1);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.WELCOME,
          completedAt: new Date('2024-01-01'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.RESOURCE_PLANNING,
          completedAt: new Date('2024-01-02'),
          completedBy: 'user1',
        },
        // Note: ROOMS_CONFIG, UPS_CONFIG, SERVERS_CONFIG are not completed
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      // Should skip to RELATIONSHIPS since resources exist
      expect(result.currentStep).toBe(SetupStep.RELATIONSHIPS);
    });

    it('should get last modified date from progress records', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(0);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(0);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(0);

      const completedSteps: Partial<SetupProgress>[] = [
        {
          step: SetupStep.WELCOME,
          completedAt: new Date('2024-01-01T10:00:00Z'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.RESOURCE_PLANNING,
          completedAt: new Date('2024-01-03T15:00:00Z'),
          completedBy: 'user1',
        },
        {
          step: SetupStep.ROOMS_CONFIG,
          completedAt: new Date('2024-01-02T12:00:00Z'),
          completedBy: 'user1',
        },
      ];
      jest
        .spyOn(setupProgressRepository, 'findAll')
        .mockResolvedValue(completedSteps as SetupProgress[]);

      const result = await useCase.execute();

      // Should use the latest date
      expect(result.lastModified).toEqual(new Date('2024-01-03T15:00:00Z'));
    });

    it('should use current date when no progress records exist', async () => {
      jest.spyOn(roomRepository, 'count').mockResolvedValue(0);
      jest.spyOn(upsRepository, 'count').mockResolvedValue(0);
      jest.spyOn(serverRepository, 'count').mockResolvedValue(0);
      jest.spyOn(setupProgressRepository, 'findAll').mockResolvedValue([]);

      const beforeDate = new Date();
      const result = await useCase.execute();
      const afterDate = new Date();

      expect(result.lastModified.getTime()).toBeGreaterThanOrEqual(
        beforeDate.getTime(),
      );
      expect(result.lastModified.getTime()).toBeLessThanOrEqual(
        afterDate.getTime(),
      );
    });
  });
});
