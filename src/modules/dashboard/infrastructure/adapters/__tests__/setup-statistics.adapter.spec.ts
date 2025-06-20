import { SetupStatisticsAdapter } from '../setup-statistics.adapters';

describe('SetupStatisticsAdapter', () => {
  const userRepo = { count: jest.fn() } as any;
  const roomRepo = { count: jest.fn() } as any;
  const upsRepo = { count: jest.fn() } as any;
  const serverRepo = { count: jest.fn() } as any;
  const vmRepo = { count: jest.fn() } as any;
  let adapter: SetupStatisticsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new SetupStatisticsAdapter(
      userRepo,
      roomRepo,
      upsRepo,
      serverRepo,
      vmRepo,
    );
  });

  it('aggregates statistics from repositories', async () => {
    userRepo.count.mockResolvedValue(10);
    roomRepo.count.mockResolvedValue(2);
    upsRepo.count.mockResolvedValue(3);
    serverRepo.count.mockResolvedValue(5);
    vmRepo.count.mockResolvedValue(20);

    const result = await adapter.getStatistics();

    expect(result).toEqual({
      totalUsers: 10,
      adminUsers: 99,
      totalRooms: 2,
      totalUps: 3,
      totalServers: 5,
      totalVms: 20,
    });
  });
});
