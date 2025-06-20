import { GetDashboardFullStatsUseCase } from '../get-dashboard-full-stats.use-case';
import { SetupStep } from '@/modules/setup/application/dto';
import { SetupProgress } from '@/modules/setup/domain/entities/setup-progress.entity';

describe('GetDashboardFullStatsUseCase', () => {
  const statisticsPort = { getStatistics: jest.fn() } as any;
  const presenceService = { getConnectedUserCount: jest.fn() } as any;
  const serverRepo = { findAll: jest.fn() } as any;
  const vmRepo = { findAll: jest.fn() } as any;
  const progressRepo = { findAll: jest.fn() } as any;
  let useCase: GetDashboardFullStatsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetDashboardFullStatsUseCase(
      statisticsPort,
      presenceService,
      serverRepo,
      vmRepo,
      progressRepo,
    );
  });

  it('computes stats with no progress', async () => {
    statisticsPort.getStatistics.mockResolvedValue({
      totalUsers: 10,
      adminUsers: 1,
      totalRooms: 5,
      totalUps: 3,
      totalServers: 2,
      totalVms: 3,
    });
    presenceService.getConnectedUserCount.mockResolvedValue(5);
    serverRepo.findAll.mockResolvedValue([{ state: 'UP' }, { state: 'DOWN' }]);
    vmRepo.findAll.mockResolvedValue([
      { state: 'UP' },
      { state: 'UP' },
      { state: 'DOWN' },
    ]);
    progressRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual({
      totalUsers: 10,
      adminUsers: 1,
      totalRooms: 5,
      totalUps: 3,
      totalServers: 2,
      totalVms: 3,
      serversUp: 1,
      serversDown: 1,
      vmsUp: 2,
      vmsDown: 1,
      setupComplete: false,
      setupProgress: 0,
      onlineUsers: 5,
    });
  });

  it('computes progress percentage', async () => {
    statisticsPort.getStatistics.mockResolvedValue({
      totalUsers: 10,
      adminUsers: 1,
      totalRooms: 5,
      totalUps: 3,
      totalServers: 3,
      totalVms: 2,
    });
    presenceService.getConnectedUserCount.mockResolvedValue(2);
    serverRepo.findAll.mockResolvedValue([
      { state: 'UP' },
      { state: 'DOWN' },
      { state: 'DOWN' },
    ]);
    vmRepo.findAll.mockResolvedValue([{ state: 'UP' }, { state: 'UP' }]);
    progressRepo.findAll.mockResolvedValue([
      { step: SetupStep.WELCOME } as SetupProgress,
      { step: SetupStep.CREATE_SERVER } as SetupProgress,
      { step: SetupStep.CREATE_ROOM } as SetupProgress,
    ]);

    const result = await useCase.execute();

    expect(result.setupProgress).toBe(60);
    expect(result.setupComplete).toBe(false);
    expect(result.serversDown).toBe(2);
    expect(result.vmsDown).toBe(0);
    expect(result.onlineUsers).toBe(2);
  });

  it('marks setup as complete when complete step found', async () => {
    statisticsPort.getStatistics.mockResolvedValue({
      totalUsers: 1,
      adminUsers: 1,
      totalRooms: 1,
      totalUps: 1,
      totalServers: 1,
      totalVms: 1,
    });
    presenceService.getConnectedUserCount.mockResolvedValue(0);
    serverRepo.findAll.mockResolvedValue([{ state: 'UP' }]);
    vmRepo.findAll.mockResolvedValue([{ state: 'UP' }]);
    progressRepo.findAll.mockResolvedValue([
      { step: SetupStep.WELCOME } as SetupProgress,
      { step: SetupStep.COMPLETE } as SetupProgress,
    ]);

    const result = await useCase.execute();

    expect(result.setupComplete).toBe(true);
    expect(result.setupProgress).toBe(40);
  });
});
