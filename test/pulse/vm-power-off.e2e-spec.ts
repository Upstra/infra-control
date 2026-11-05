import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { PythonExecutorService } from '@/core/services/python-executor/python-executor.service';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import { CollectVcenterEventsUseCase } from '@/modules/vmware/application/use-cases/collect-vcenter-events.use-case';
import { PowerOffCauseDomainService } from '@/modules/vmware/domain/services/power-off-cause.domain.service';
import { VmwareTelemetryCacheService } from '@/modules/vmware/application/services/vmware-telemetry-cache.service';
import { UpstraPlanStatusService } from '@/modules/vmware/application/services/upstra-plan-status.service';
import { VmwareConnectionService } from '@/modules/vmware/domain/services/vmware-connection.service';
import { AlertsController } from '@/modules/alerts/application/controllers/alerts.controller';
import { AlertUseCases } from '@/modules/alerts/application/use-cases';
import { AlertService } from '@/modules/alerts/domain/services/alert.service';
import { VmwareAlertsListener } from '@/modules/alerts/application/listeners/vmware-alerts.listener';
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

describe('VM powered off outside the Upstra plan (e2e)', () => {
  let app: INestApplication;
  let collect: CollectVcenterEventsUseCase;
  let events: object[] = [];
  let key = 1000;
  const transitions = new InMemoryAlertTransitionRepository([ADMIN]);
  const alerts = new InMemoryAlertRepository(transitions);
  transitions.alerts = alerts;
  const vm = {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'db-pg-02',
    moid: 'vm-1042',
    priority: 1,
  };
  const vcenter = { ip: 'vcsim', login: 'svc-upstra', password: 'secret' };

  const vcenterEvent = (type: string, userName: string) => ({
    key: ++key,
    type,
    createdAt: new Date(Date.now() + key).toISOString(),
    userName,
    vmMoid: vm.moid,
    vmName: vm.name,
    hostMoid: 'host-33',
    hostName: 'esx-03',
    message: `${vm.name} ${type}`,
  });
  const openVmAlerts = async () =>
    (
      await request(app.getHttpServer())
        .get('/alerts?status=open&resourceType=vm')
        .expect(200)
    ).body.items;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({ ignoreEnvFile: true }),
      ],
      controllers: [AlertsController],
      providers: [
        CollectVcenterEventsUseCase,
        PowerOffCauseDomainService,
        VmwareTelemetryCacheService,
        UpstraPlanStatusService,
        VmwareConnectionService,
        AlertService,
        VmwareAlertsListener,
        AlertPermissionService,
        LogHistoryUseCase,
        ...AlertUseCases,
        {
          provide: PythonExecutorService,
          useValue: {
            executePython: async () => {
              const batch = events;
              events = [];
              return { until: new Date().toISOString(), events: batch };
            },
          },
        },
        { provide: RedisSafeService, useValue: new FakeRedis() },
        {
          provide: 'ServerRepositoryInterface',
          useValue: {
            findServerByTypeWithCredentials: async () => vcenter,
            findAllByField: async () => [],
          },
        },
        {
          provide: 'VmRepositoryInterface',
          useValue: { findOneByField: async () => vm },
        },
        { provide: 'AlertRepositoryInterface', useValue: alerts },
        {
          provide: 'AlertTransitionRepositoryInterface',
          useValue: transitions,
        },
        {
          provide: 'HistoryRepositoryInterface',
          useValue: new InMemoryHistoryRepository([ADMIN]),
        },
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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
    collect = app.get(CollectVcenterEventsUseCase);
  });

  afterAll(async () => app.close());

  it('opens a critical alert naming the user who powered the VM off', async () => {
    events = [vcenterEvent('VmPoweredOffEvent', 'VSPHERE.LOCAL\\jbidule')];
    await collect.execute();

    const [alert] = await eventually(
      openVmAlerts,
      (items) => items.length === 1,
    );
    expect(alert).toMatchObject({
      type: 'vm_powered_off',
      severity: 'critical',
      resourceName: 'db-pg-02',
      message:
        'db-pg-02 a été arrêtée manuellement par VSPHERE.LOCAL\\jbidule.',
    });
  });

  it('resolves the alert when the VM is powered back on', async () => {
    events = [vcenterEvent('VmPoweredOnEvent', 'VSPHERE.LOCAL\\jbidule')];
    await collect.execute();

    await eventually(openVmAlerts, (items) => items.length === 0);
  });

  it('stays silent when the Upstra service account powers the VM off', async () => {
    events = [vcenterEvent('VmPoweredOffEvent', 'VSPHERE.LOCAL\\svc-upstra')];
    await collect.execute();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(await openVmAlerts()).toEqual([]);
    expect(alerts.alerts).toHaveLength(1);
  });
});
