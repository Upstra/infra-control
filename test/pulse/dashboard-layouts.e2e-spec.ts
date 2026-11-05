import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DashboardWidget } from '@/modules/dashboard/domain/entities/dashboard-widget.entity';
import * as request from 'supertest';
import { JwtAuthGuard } from '@/modules/auth/infrastructure/guards/jwt-auth.guard';
import { setupValidationPipe } from '@/core/config/validation.config';
import { DashboardLayoutController } from '@/modules/dashboard/application/controllers/dashboard-layout.controller';
import {
  CreateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
  UpdateLayoutUseCase,
} from '@/modules/dashboard/application/use-cases/layouts';
import { DashboardLayoutDomainService } from '@/modules/dashboard/domain/services/dashboard-layout.domain.service';
import { DashboardLayoutRepository } from '@/modules/dashboard/infrastructure/repositories/dashboard-layout.repository';
import { DashboardRateLimitGuard } from '@/modules/dashboard/application/guards/dashboard-rate-limit.guard';
import { InMemoryLayoutRepository, TestAuthGuard } from './support/in-memory';

describe('Custom dashboards (e2e)', () => {
  let app: INestApplication;
  const layouts = new InMemoryLayoutRepository();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardLayoutController],
      providers: [
        CreateLayoutUseCase,
        UpdateLayoutUseCase,
        DeleteLayoutUseCase,
        GetLayoutUseCase,
        ListLayoutsUseCase,
        SetDefaultLayoutUseCase,
        DashboardLayoutDomainService,
        { provide: DashboardLayoutRepository, useValue: layouts },
        {
          provide: getRepositoryToken(DashboardWidget),
          useValue: { delete: async () => undefined },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestAuthGuard)
      .overrideGuard(DashboardRateLimitGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(setupValidationPipe());
    await app.init();
  });

  afterAll(async () => app.close());

  it('gives a new user the default Pulse dashboard', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/layouts')
      .expect(200);

    const [layout] = response.body.layouts;
    expect(layout).toMatchObject({
      name: 'Tableau principal',
      isDefault: true,
    });
    expect(
      layout.widgets.map((widget) => `${widget.type}:${widget.position.w}`),
    ).toEqual([
      'incident:12',
      'kpis:12',
      'ups:8',
      'hosts:4',
      'vms:8',
      'events:4',
    ]);
  });

  it('accepts the new widget types with an order and an allowed width', async () => {
    const response = await request(app.getHttpServer())
      .post('/dashboard/layouts')
      .send({
        name: 'Salle B',
        widgets: [
          {
            type: 'power',
            title: 'Puissance',
            position: { x: 0, y: 0, w: 8, h: 1 },
          },
          {
            type: 'presence',
            title: 'Qui est connecté',
            position: { x: 1, y: 0, w: 4, h: 1 },
          },
        ],
      })
      .expect(201);

    expect(response.body.widgets.map((widget) => widget.type)).toEqual([
      'power',
      'presence',
    ]);
  });

  it('refuses a width outside 4, 6, 8, 12 and a fractional rank', async () => {
    const widget = (position: object) => ({
      name: 'Invalide',
      widgets: [{ type: 'kpis', title: 'KPI', position }],
    });

    await request(app.getHttpServer())
      .post('/dashboard/layouts')
      .send(widget({ x: 0, y: 0, w: 5, h: 1 }))
      .expect(400);
    await request(app.getHttpServer())
      .post('/dashboard/layouts')
      .send(widget({ x: 1.5, y: 0, w: 4, h: 1 }))
      .expect(400);
  });
});
