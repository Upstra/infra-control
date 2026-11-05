import { GetInfrastructureKpisUseCase } from '../get-infrastructure-kpis.use-case';
import { VmHealthDomainService } from '@/modules/vmware/domain/services/vm-health.domain.service';
import {
  createHostTelemetry,
  createVmTelemetry,
} from '@/modules/vmware/__mocks__/vmware-telemetry.mock';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';
import {
  createMockBatteryStatus,
  createMockUpsTelemetry,
} from '@/modules/ups/__mocks__/ups-telemetry.mock';

describe('GetInfrastructureKpisUseCase', () => {
  const vmwareCache = { getHosts: jest.fn(), getVms: jest.fn() };
  const upsRepository = { findAll: jest.fn() };
  const upsCache = { getMultiple: jest.fn() };
  const environment = { global: jest.fn() };
  const redis = { safeGet: jest.fn() };
  const alertSummary = { execute: jest.fn() };
  const python = { executePython: jest.fn() };
  const useCase = new GetInfrastructureKpisUseCase(
    vmwareCache as any,
    new VmHealthDomainService(),
    upsRepository as any,
    upsCache as any,
    environment as any,
    redis as any,
    alertSummary as any,
    { get: jest.fn() } as any,
  );
  const base = createMockUpsTelemetry();
  const withoutNominal = createMockUpsTelemetry({
    load: { ...base.load, nominalRealPowerW: null },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    vmwareCache.getHosts.mockResolvedValue({
      'host-1': createHostTelemetry({ moid: 'host-1' }),
      'host-2': createHostTelemetry({
        moid: 'host-2',
        connectionState: 'notResponding',
      }),
    });
    vmwareCache.getVms.mockResolvedValue({
      a: createVmTelemetry({ moid: 'a' }),
      b: createVmTelemetry({ moid: 'b', health: 'down' }),
      c: createVmTelemetry({
        moid: 'c',
        metricsAt: '2020-01-01T00:00:00.000Z',
      }),
    });
    environment.global.mockResolvedValue({
      maxInletC: 31,
      maxInletRoomId: 'room-b',
      maxInletServerId: 'srv-3',
      maxInletServerName: 'srv-b2-03',
      totalConsumedW: 412,
    });
    redis.safeGet.mockResolvedValue(
      JSON.stringify({
        open: { critical: 1, warning: 2, info: 0 },
        unacknowledgedCritical: 1,
      }),
    );
  });

  it('sums power and capacity, counting UPS on battery', async () => {
    upsRepository.findAll.mockResolvedValue([
      createMockUps({ id: 'u1' }),
      createMockUps({ id: 'u2', nominalPowerW: 1500 }),
    ]);
    upsCache.getMultiple.mockResolvedValue({
      u1: createMockBatteryStatus({ telemetry: base, onBattery: true }),
      u2: createMockBatteryStatus({
        telemetry: withoutNominal,
        onBattery: false,
      }),
    });

    const kpis = await useCase.execute();

    expect(kpis).toMatchObject({
      totalPowerW: 2400,
      totalCapacityW: 4500,
      upsOnBattery: 1,
    });
    expect(kpis.openAlerts).toEqual({ critical: 1, warning: 2, info: 0 });
    expect(alertSummary.execute).not.toHaveBeenCalled();
  });

  it('returns a null capacity as soon as one UPS has no nominal power', async () => {
    upsRepository.findAll.mockResolvedValue([
      createMockUps({ id: 'u1' }),
      createMockUps({ id: 'u2', nominalPowerW: null }),
    ]);
    upsCache.getMultiple.mockResolvedValue({
      u1: createMockBatteryStatus({ telemetry: base }),
      u2: createMockBatteryStatus({ telemetry: withoutNominal }),
    });

    await expect(useCase.execute()).resolves.toMatchObject({
      totalCapacityW: null,
      totalPowerW: 2400,
    });
  });

  it('reads hosts, VM health and the hottest inlet from the cache without running scripts', async () => {
    upsRepository.findAll.mockResolvedValue([]);
    upsCache.getMultiple.mockResolvedValue({});

    const kpis = await useCase.execute();

    expect(kpis).toMatchObject({
      hostsTotal: 2,
      hostsConnected: 1,
      vmsByHealth: { up: 1, degraded: 0, down: 1, unknown: 1 },
      maxInletC: 31,
      maxInletRoomId: 'room-b',
      maxInletServerName: 'srv-b2-03',
      totalPowerW: null,
      totalCapacityW: null,
    });
    expect(python.executePython).not.toHaveBeenCalled();
  });
});
