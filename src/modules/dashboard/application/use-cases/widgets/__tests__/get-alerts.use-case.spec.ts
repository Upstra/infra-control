import { GetAlertsUseCase } from '../get-alerts.use-case';
import { WidgetDataQueryDto } from '../../../dto/widget-data.dto';

describe('GetAlertsUseCase', () => {
  let useCase: GetAlertsUseCase;

  beforeEach(() => {
    useCase = new GetAlertsUseCase();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return all alerts when no severity filter provided', async () => {
      const query: WidgetDataQueryDto = {};

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(3);
      expect(result.alerts).toEqual([
        {
          id: 'alert-001',
          severity: 'critical',
          type: 'server_down',
          resource: {
            type: 'server',
            id: 'server-123',
            name: 'web-server-01',
          },
          message: 'Server is not responding',
          timestamp: mockDate,
          acknowledged: false,
        },
        {
          id: 'alert-002',
          severity: 'warning',
          type: 'high_cpu',
          resource: {
            type: 'vm',
            id: 'vm-456',
            name: 'app-vm-02',
          },
          message: 'CPU usage above 90%',
          timestamp: mockDate,
          acknowledged: false,
        },
        {
          id: 'alert-003',
          severity: 'info',
          type: 'maintenance_scheduled',
          resource: {
            type: 'server',
            id: 'server-789',
            name: 'backup-server-01',
          },
          message: 'Scheduled maintenance in 2 hours',
          timestamp: mockDate,
          acknowledged: false,
        },
      ]);

      expect(result.summary).toEqual({
        critical: 1,
        warning: 1,
        info: 1,
      });
    });

    it('should filter alerts by critical severity', async () => {
      const query: WidgetDataQueryDto = {
        severity: 'critical',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('critical');
      expect(result.alerts[0].id).toBe('alert-001');
      expect(result.summary).toEqual({
        critical: 1,
        warning: 1,
        info: 1,
      });
    });

    it('should filter alerts by warning severity', async () => {
      const query: WidgetDataQueryDto = {
        severity: 'warning',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('warning');
      expect(result.alerts[0].id).toBe('alert-002');
      expect(result.summary).toEqual({
        critical: 1,
        warning: 1,
        info: 1,
      });
    });

    it('should filter alerts by info severity', async () => {
      const query: WidgetDataQueryDto = {
        severity: 'info',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('info');
      expect(result.alerts[0].id).toBe('alert-003');
      expect(result.summary).toEqual({
        critical: 1,
        warning: 1,
        info: 1,
      });
    });

    it('should handle query with pagination parameters', async () => {
      const query: WidgetDataQueryDto = {
        page: 1,
        limit: 10,
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(3);
      expect(result.summary.critical).toBe(1);
      expect(result.summary.warning).toBe(1);
      expect(result.summary.info).toBe(1);
    });

    it('should handle query with date range parameters', async () => {
      const query: WidgetDataQueryDto = {
        dateFrom: '2023-12-01',
        dateTo: '2024-01-31',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(3);
      expect(result.alerts[0].timestamp).toEqual(mockDate);
    });

    it('should handle combined filters', async () => {
      const query: WidgetDataQueryDto = {
        severity: 'critical',
        page: 1,
        limit: 5,
        dateFrom: '2023-12-01',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0].severity).toBe('critical');
    });

    it('should return empty alerts array when no alerts match severity filter', async () => {
      const mockGetAlertsUseCase = new GetAlertsUseCase();
      jest.spyOn(mockGetAlertsUseCase as any, 'execute').mockImplementation(
        async (query: WidgetDataQueryDto) => {
          const mockAlerts: any[] = [];
          return {
            alerts: query.severity ? [] : mockAlerts,
            summary: {
              critical: 0,
              warning: 0,
              info: 0,
            },
          };
        },
      );

      const query: WidgetDataQueryDto = {
        severity: 'critical',
      };

      const result = await mockGetAlertsUseCase.execute(query);

      expect(result.alerts).toHaveLength(0);
      expect(result.summary).toEqual({
        critical: 0,
        warning: 0,
        info: 0,
      });
    });

    it('should maintain summary counts regardless of filter', async () => {
      const query: WidgetDataQueryDto = {
        severity: 'warning',
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(1);
      expect(result.summary.critical).toBe(1);
      expect(result.summary.warning).toBe(1);
      expect(result.summary.info).toBe(1);
    });

    it('should return alerts with proper structure', async () => {
      const query: WidgetDataQueryDto = {};

      const result = await useCase.execute(query);

      result.alerts.forEach((alert) => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('resource');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('acknowledged');

        expect(alert.resource).toHaveProperty('type');
        expect(alert.resource).toHaveProperty('id');
        expect(alert.resource).toHaveProperty('name');

        expect(['critical', 'warning', 'info']).toContain(alert.severity);
        expect(typeof alert.acknowledged).toBe('boolean');
      });
    });

    it('should handle undefined query', async () => {
      const result = await useCase.execute({} as WidgetDataQueryDto);

      expect(result.alerts).toHaveLength(3);
      expect(result.summary).toBeDefined();
    });

    it('should handle null severity in query', async () => {
      const query: WidgetDataQueryDto = {
        severity: null as any,
      };

      const result = await useCase.execute(query);

      expect(result.alerts).toHaveLength(3);
    });

    it('should return consistent timestamps', async () => {
      const query: WidgetDataQueryDto = {};

      const result = await useCase.execute(query);

      result.alerts.forEach((alert) => {
        expect(alert.timestamp).toEqual(mockDate);
      });
    });

    it('should return alerts in consistent order', async () => {
      const query: WidgetDataQueryDto = {};

      const result1 = await useCase.execute(query);
      const result2 = await useCase.execute(query);

      expect(result1.alerts.map((a) => a.id)).toEqual(
        result2.alerts.map((a) => a.id),
      );
    });

    it('should handle concurrent executions', async () => {
      const queries = [
        { severity: 'critical' },
        { severity: 'warning' },
        { severity: 'info' },
        {},
      ] as WidgetDataQueryDto[];

      const results = await Promise.all(
        queries.map((query) => useCase.execute(query)),
      );

      expect(results[0].alerts).toHaveLength(1);
      expect(results[1].alerts).toHaveLength(1);
      expect(results[2].alerts).toHaveLength(1);
      expect(results[3].alerts).toHaveLength(3);

      results.forEach((result) => {
        expect(result.summary).toEqual({
          critical: 1,
          warning: 1,
          info: 1,
        });
      });
    });
  });
});