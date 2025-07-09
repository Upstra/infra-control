import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { DashboardWidgetController } from '../dashboard-widget.controller';
import {
  GetActivityFeedUseCase,
  GetAlertsUseCase,
  GetResourceUsageUseCase,
  GetUserPresenceUseCase,
  GetSystemHealthUseCase,
  GetUpsStatusUseCase,
  ExportWidgetDataUseCase,
} from '../../use-cases/widgets';
import {
  ActivityFeedResponseDto,
  AlertsResponseDto,
  ResourceUsageResponseDto,
  UserPresenceResponseDto,
  SystemHealthResponseDto,
  UpsStatusResponseDto,
  WidgetDataQueryDto,
  ExportQueryDto,
} from '../../dto/widget-data.dto';

describe('DashboardWidgetController', () => {
  let controller: DashboardWidgetController;
  let getActivityFeedUseCase: jest.Mocked<GetActivityFeedUseCase>;
  let getAlertsUseCase: jest.Mocked<GetAlertsUseCase>;
  let getResourceUsageUseCase: jest.Mocked<GetResourceUsageUseCase>;
  let getUserPresenceUseCase: jest.Mocked<GetUserPresenceUseCase>;
  let getSystemHealthUseCase: jest.Mocked<GetSystemHealthUseCase>;
  let getUpsStatusUseCase: jest.Mocked<GetUpsStatusUseCase>;
  let exportWidgetDataUseCase: jest.Mocked<ExportWidgetDataUseCase>;

  const mockActivityFeed: ActivityFeedResponseDto = {
    activities: [
      {
        id: '1',
        type: 'server_created',
        actor: {
          id: 'user-1',
          name: 'John Doe',
        },
        target: {
          type: 'server',
          id: 'server-1',
          name: 'Production Server',
        },
        timestamp: new Date(),
        description: 'Created server Production Server',
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
    },
  };

  const mockAlerts: AlertsResponseDto = {
    alerts: [
      {
        id: '1',
        severity: 'warning',
        type: 'resource_usage',
        resource: {
          type: 'server',
          id: 'server-1',
          name: 'Production Server',
        },
        message: 'CPU usage exceeded 80% threshold',
        timestamp: new Date(),
        acknowledged: false,
      },
    ],
    summary: {
      critical: 0,
      warning: 1,
      info: 0,
    },
  };

  const mockResourceUsage: ResourceUsageResponseDto = {
    cpu: {
      usage: 45.5,
      trend: 'up',
    },
    memory: {
      usage: 62.3,
      trend: 'stable',
    },
    storage: {
      usage: 78.9,
      trend: 'up',
    },
    network: {
      inbound: '125.4 MB/s',
      outbound: '87.2 MB/s',
      trend: 'stable',
    },
  };

  const mockUserPresence: UserPresenceResponseDto = {
    onlineUsers: [
      {
        id: 'user-1',
        name: 'john.doe',
        status: 'active',
        location: 'Dashboard',
        lastSeen: new Date(),
      },
    ],
    recentlyOffline: [],
    summary: {
      online: 1,
      idle: 0,
      offline: 0,
    },
  };

  const mockSystemHealth: SystemHealthResponseDto = {
    status: 'healthy',
    score: 95,
    components: [
      {
        name: 'database',
        status: 'operational',
        responseTime: 15,
        uptime: 99.9,
      },
      {
        name: 'redis',
        status: 'operational',
        responseTime: 8,
        uptime: 99.95,
      },
    ],
    lastCheck: new Date(),
  };

  const mockUpsStatus: UpsStatusResponseDto = {
    ups: [
      {
        id: 'ups-1',
        name: 'Main UPS',
        status: 'online',
        batteryLevel: 100,
        load: 45,
        runtime: 120,
        temperature: 25,
        lastTest: new Date(),
        nextTest: new Date(),
        isMocked: true,
      },
    ],
    summary: {
      total: 1,
      online: 1,
      onBattery: 0,
      offline: 0,
      unavailable: 0,
      averageLoad: 45,
      isMocked: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardWidgetController],
      providers: [
        {
          provide: GetActivityFeedUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAlertsUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetResourceUsageUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserPresenceUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSystemHealthUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUpsStatusUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ExportWidgetDataUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DashboardWidgetController>(
      DashboardWidgetController,
    );
    getActivityFeedUseCase = module.get(GetActivityFeedUseCase);
    getAlertsUseCase = module.get(GetAlertsUseCase);
    getResourceUsageUseCase = module.get(GetResourceUsageUseCase);
    getUserPresenceUseCase = module.get(GetUserPresenceUseCase);
    getSystemHealthUseCase = module.get(GetSystemHealthUseCase);
    getUpsStatusUseCase = module.get(GetUpsStatusUseCase);
    exportWidgetDataUseCase = module.get(ExportWidgetDataUseCase);
  });

  describe('getActivityFeed', () => {
    it('should return activity feed data', async () => {
      const query: WidgetDataQueryDto = { limit: 10 };
      getActivityFeedUseCase.execute.mockResolvedValue(mockActivityFeed);

      const result = await controller.getActivityFeed(query);

      expect(result).toEqual(mockActivityFeed);
      expect(getActivityFeedUseCase.execute).toHaveBeenCalledWith(query);
    });

    it('should handle query with date range', async () => {
      const query: WidgetDataQueryDto = {
        limit: 20,
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
      };
      getActivityFeedUseCase.execute.mockResolvedValue(mockActivityFeed);

      const result = await controller.getActivityFeed(query);

      expect(result).toEqual(mockActivityFeed);
      expect(getActivityFeedUseCase.execute).toHaveBeenCalledWith(query);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts data', async () => {
      const query: WidgetDataQueryDto = { limit: 10 };
      getAlertsUseCase.execute.mockResolvedValue(mockAlerts);

      const result = await controller.getAlerts(query);

      expect(result).toEqual(mockAlerts);
      expect(getAlertsUseCase.execute).toHaveBeenCalledWith(query);
    });

    it('should handle empty alerts', async () => {
      const query: WidgetDataQueryDto = { limit: 10 };
      const emptyAlerts: AlertsResponseDto = {
        alerts: [],
        summary: {
          critical: 0,
          warning: 0,
          info: 0,
        },
      };
      getAlertsUseCase.execute.mockResolvedValue(emptyAlerts);

      const result = await controller.getAlerts(query);

      expect(result).toEqual(emptyAlerts);
    });
  });

  describe('getResourceUsage', () => {
    it('should return resource usage data', async () => {
      getResourceUsageUseCase.execute.mockResolvedValue(mockResourceUsage);

      const result = await controller.getResourceUsage();

      expect(result).toEqual(mockResourceUsage);
      expect(getResourceUsageUseCase.execute).toHaveBeenCalled();
    });

    it('should handle errors from use case', async () => {
      const error = new Error('Failed to fetch resource usage');
      getResourceUsageUseCase.execute.mockRejectedValue(error);

      await expect(controller.getResourceUsage()).rejects.toThrow(error);
    });
  });

  describe('getUserPresence', () => {
    it('should return user presence data', async () => {
      getUserPresenceUseCase.execute.mockResolvedValue(mockUserPresence);

      const result = await controller.getUserPresence();

      expect(result).toEqual(mockUserPresence);
      expect(getUserPresenceUseCase.execute).toHaveBeenCalled();
    });

    it('should handle no users online', async () => {
      const noUsersOnline: UserPresenceResponseDto = {
        onlineUsers: [],
        recentlyOffline: [],
        summary: {
          online: 0,
          idle: 0,
          offline: 0,
        },
      };
      getUserPresenceUseCase.execute.mockResolvedValue(noUsersOnline);

      const result = await controller.getUserPresence();

      expect(result).toEqual(noUsersOnline);
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health data', async () => {
      getSystemHealthUseCase.execute.mockResolvedValue(mockSystemHealth);

      const result = await controller.getSystemHealth();

      expect(result).toEqual(mockSystemHealth);
      expect(getSystemHealthUseCase.execute).toHaveBeenCalled();
    });

    it('should handle unhealthy system status', async () => {
      const unhealthyStatus: SystemHealthResponseDto = {
        status: 'unhealthy',
        score: 25,
        components: [
          {
            name: 'database',
            status: 'down',
            responseTime: 0,
            uptime: 85.5,
            issues: ['Database connection failed'],
          },
        ],
        lastCheck: new Date(),
      };
      getSystemHealthUseCase.execute.mockResolvedValue(unhealthyStatus);

      const result = await controller.getSystemHealth();

      expect(result).toEqual(unhealthyStatus);
    });
  });

  describe('getUpsStatus', () => {
    it('should return UPS status data', async () => {
      getUpsStatusUseCase.execute.mockResolvedValue(mockUpsStatus);

      const result = await controller.getUpsStatus();

      expect(result).toEqual(mockUpsStatus);
      expect(getUpsStatusUseCase.execute).toHaveBeenCalled();
    });

    it('should handle no UPS devices', async () => {
      const noDevices: UpsStatusResponseDto = {
        ups: [],
        summary: {
          total: 0,
          online: 0,
          onBattery: 0,
          offline: 0,
          unavailable: 0,
          averageLoad: 0,
          isMocked: true,
        },
      };
      getUpsStatusUseCase.execute.mockResolvedValue(noDevices);

      const result = await controller.getUpsStatus();

      expect(result).toEqual(noDevices);
    });
  });

  describe('exportWidgetData', () => {
    it('should export widget data as CSV', async () => {
      const widgetId = 'widget-1';
      const query: ExportQueryDto = { format: 'csv' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportData = {
        data: 'header1,header2\nvalue1,value2',
        contentType: 'text/csv',
        filename: 'widget-data.csv',
      };
      exportWidgetDataUseCase.execute.mockResolvedValue(exportData);

      await controller.exportWidgetData(widgetId, query, mockResponse);

      expect(exportWidgetDataUseCase.execute).toHaveBeenCalledWith(
        widgetId,
        query,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="widget-data.csv"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(exportData.data);
    });

    it('should export widget data as JSON', async () => {
      const widgetId = 'widget-2';
      const query: ExportQueryDto = { format: 'json' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const exportData = {
        data: JSON.stringify({ data: [{ id: 1, value: 'test' }] }),
        contentType: 'application/json',
        filename: 'widget-data.json',
      };
      exportWidgetDataUseCase.execute.mockResolvedValue(exportData);

      await controller.exportWidgetData(widgetId, query, mockResponse);

      expect(exportWidgetDataUseCase.execute).toHaveBeenCalledWith(
        widgetId,
        query,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="widget-data.json"',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(exportData.data);
    });

    it('should handle export errors', async () => {
      const widgetId = 'widget-3';
      const query: ExportQueryDto = { format: 'csv' };
      const mockResponse = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      const error = new Error('Export failed');
      exportWidgetDataUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.exportWidgetData(widgetId, query, mockResponse),
      ).rejects.toThrow(error);
    });
  });
});
