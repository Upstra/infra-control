import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { setupValidationPipe } from '@/core/config/validation.config';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { GetUpsBatteryUseCase } from '@/modules/ups/application/use-cases/get-ups-battery.use-case';
import { CheckAllUpsBatteriesUseCase } from '@/modules/ups/application/use-cases/check-all-ups-batteries.use-case';
import { UpsBatteryDomainService } from '@/modules/ups/domain/services/ups-battery.domain.service';
import { UpsBatteryCacheService } from '@/modules/ups/application/services/ups-battery-cache.service';
import { AlertsController } from '@/modules/alerts/application/controllers/alerts.controller';
import { EventsFeedController } from '@/modules/alerts/application/controllers/events-feed.controller';
import { AlertUseCases } from '@/modules/alerts/application/use-cases';
import { AlertService } from '@/modules/alerts/domain/services/alert.service';
import { UpsAlertsListener } from '@/modules/alerts/application/listeners/ups-alerts.listener';
import { AlertSummaryPublisher } from '@/modules/alerts/application/listeners/alert-summary.publisher';
import { AlertPermissionService } from '@/modules/alerts/application/services/alert-permission.service';
import { LogHistoryUseCase } from '@/modules/history/application/use-cases/log-history.use-case';
import {
  ADMIN,
  eventually,
  FakeRedis,
  InMemoryAlertRepository,
  InMemoryAlertTransitionRepository,
  InMemoryHistoryRepository,
  TestAuthGuard,
} from './support/in-memory';

const UPS = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'UPS-B2',
  ip: 'http://mock-ups:8000',
  roomId: '33333333-3333-4333-8333-333333333333',
};

describe('Power outage on a UPS (e2e)', () => {
  let app: INestApplication;
  let checkAll: CheckAllUpsBatteriesUseCase;
  const mains = { onBattery: false, charge: 100, runtimeSeconds: 3600 };
  const users = [ADMIN];
  const transitions = new InMemoryAlertTransitionRepository(users);
  const alerts = new InMemoryAlertRepository(transitions);
  const history = new InMemoryHistoryRepository(users);
  transitions.alerts = alerts;

  const telemetry = () => ({
    source: 'http',
    collectedAt: new Date().toISOString(),
    device: {
      manufacturer: 'APC',
      model: 'Smart-UPS SRT 3000',
      serial: null,
      firmware: null,
    },
    status: {
      raw: mains.onBattery ? 'OB DISCHRG' : 'OL',
      onBattery: mains.onBattery,
      lowBattery: false,
      charging: false,
      onBypass: false,
      overload: false,
      replaceBattery: false,
    },
    battery: {
      chargePercent: mains.charge,
      runtimeSeconds: mains.runtimeSeconds,
      voltage: null,
      temperatureC: 31,
      lastTestResult: null,
      lastTestAt: null,
    },
    input: { voltage: mains.onBattery ? 0 : 230, frequencyHz: null },
    output: { voltage: 230, frequencyHz: 50 },
    load: { percent: 61, realPowerW: 1830, nominalRealPowerW: 3000 },
    temperatureC: 31,
  });

  const summary = async () =>
    (await request(app.getHttpServer()).get('/alerts/summary').expect(200))
      .body;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({ ignoreEnvFile: true }),
      ],
      controllers: [AlertsController, EventsFeedController],
      providers: [
        GetUpsBatteryUseCase,
        CheckAllUpsBatteriesUseCase,
        UpsBatteryDomainService,
        UpsBatteryCacheService,
        AlertService,
        UpsAlertsListener,
        AlertSummaryPublisher,
        AlertPermissionService,
        LogHistoryUseCase,
        ...AlertUseCases,
        {
          provide: PythonExecutorService,
          useValue: { executePython: async () => telemetry() },
        },
        {
          provide: 'UpsRepositoryInterface',
          useValue: {
            findUpsById: async () => UPS,
            findAll: async () => [UPS],
          },
        },
        { provide: RedisSafeService, useValue: new FakeRedis() },
        { provide: 'AlertRepositoryInterface', useValue: alerts },
        {
          provide: 'AlertTransitionRepositoryInterface',
          useValue: transitions,
        },
        { provide: 'HistoryRepositoryInterface', useValue: history },
        {
          provide: 'UserRepositoryInterface',
          useValue: {
            findOneByField: async () => ({ roles: [{ isAdmin: true }] }),
          },
        },
        {
          provide: 'PermissionStrategyFactory',
          useValue: {
            getStrategy: () => ({ checkPermission: async () => false }),
          },
        },
        {
          provide: 'ServerRepositoryInterface',
          useValue: { findAllByField: async () => [] },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(setupValidationPipe());
    await app.init();
    checkAll = app.get(CheckAllUpsBatteriesUseCase);
  });

  afterAll(async () => app.close());

  it('opens one critical alert when mains drop, and keeps it single on the next readings', async () => {
    await checkAll.execute();
    expect(await summary()).toEqual({
      open: { critical: 0, warning: 0, info: 0 },
      unacknowledgedCritical: 0,
    });

    Object.assign(mains, { onBattery: true, charge: 38, runtimeSeconds: 840 });
    await checkAll.execute();
    await eventually(summary, (body) => body.unacknowledgedCritical === 1);
    await checkAll.execute();

    const list = await request(app.getHttpServer())
      .get('/alerts?status=open')
      .expect(200);
    expect(list.body.totalItems).toBe(1);
    expect(list.body.items[0]).toMatchObject({
      type: 'ups_on_battery',
      severity: 'critical',
      title: 'UPS-B2 est sur batterie',
    });
    const detail = await eventually(
      async () =>
        (
          await request(app.getHttpServer())
            .get(`/alerts/${list.body.items[0].id}`)
            .expect(200)
        ).body,
      (body) => body.occurrences >= 2,
    );
    expect(detail.transitions.map((transition) => transition.type)).toEqual([
      'opened',
    ]);
  });

  it('records the acknowledgement in the history and in the unified feed', async () => {
    const [alert] = alerts.alerts;

    const response = await request(app.getHttpServer())
      .post(`/alerts/${alert.id}/acknowledge`)
      .expect(200);

    expect(response.body.acknowledged).toBe(true);
    expect(history.events).toEqual([
      expect.objectContaining({
        entity: 'alert',
        action: 'ACKNOWLEDGE',
        userId: ADMIN.id,
      }),
    ]);
    await eventually(summary, (body) => body.unacknowledgedCritical === 0);
    const feed = await request(app.getHttpServer())
      .get('/events/feed?limit=5')
      .expect(200);
    expect(feed.body.items[0]).toMatchObject({
      kind: 'alert',
      event: 'acknowledged',
      title: 'jbidule a acquitté UPS-B2',
    });
  });

  it('resolves the alert on its own when mains come back and refuses to acknowledge it again', async () => {
    Object.assign(mains, {
      onBattery: false,
      charge: 40,
      runtimeSeconds: 1500,
    });
    await checkAll.execute();

    await eventually(summary, (body) => body.open.critical === 0);
    const [alert] = alerts.alerts;
    await request(app.getHttpServer())
      .post(`/alerts/${alert.id}/acknowledge`)
      .expect(409);
    const feed = await request(app.getHttpServer())
      .get('/events/feed?limit=5')
      .expect(200);
    expect(feed.body.items.map((item) => item.title)).toContain(
      'Résolue : UPS-B2 est sur batterie',
    );
  });
});
