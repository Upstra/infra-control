import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../dashboard.controller';
import { GetDashboardFullStatsUseCase } from '../../use-cases';
import { GetHistoryStatsUseCase } from '@/modules/history/application/use-cases';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { RoleGuard } from '@/core/guards/role.guard';

describe('DashboardController', () => {
  let controller: DashboardController;
  const getStats = { execute: jest.fn() } as any;

  beforeEach(async () => {
    const mockJwtGuard = { canActivate: jest.fn().mockReturnValue(true) };
    const mockRoleGuard = { canActivate: jest.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: GetDashboardFullStatsUseCase, useValue: getStats },
        { provide: GetHistoryStatsUseCase, useValue: { execute: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(RoleGuard)
      .useValue(mockRoleGuard)
      .compile();

    controller = module.get(DashboardController);
  });

  it('returns dashboard stats', async () => {
    getStats.execute.mockResolvedValue({ totalUsers: 1 });
    const result = await controller.getFullDashboard();
    expect(getStats.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalUsers: 1 });
  });
});
