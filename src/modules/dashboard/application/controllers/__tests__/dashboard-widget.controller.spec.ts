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
    items: [
      {
        id: '1',
        type: 'server_created',
        timestamp: new Date(),
        userId: 'user-1',
        userName: 'John Doe',
        action: 'created',
        resource: 'server',
        resourceId: 'server-1',
        resourceName: 'Production Server',
        metadata: {},
      },
    ],
    total: 1,
    hasMore: false,
  };

  const mockAlerts: AlertsResponseDto = {
    alerts: [
      {
        id: '1',
        level: 'warning',
        title: 'High CPU Usage',
        message: 'CPU usage exceeded 80% threshold',
        timestamp: new Date(),
        resourceType: 'server',
        resourceId: 'server-1',
        isAcknowledged: false,
      },
    ],
    total: 1,
    unacknowledged: 1,
  };

  const mockResourceUsage: ResourceUsageResponseDto = {
    servers: {
      total: 10,
      active: 8,
      inactive: 2,
      cpuUsage: 45.5,
      memoryUsage: 62.3,
      storageUsage: 78.9,
    },
    vms: {
      total: 25,
      active: 20,
      inactive: 5,
      cpuUsage: 38.2,
      memoryUsage: 55.7,
      storageUsage: 71.4,
    },
    overall: {
      cpuUsage: 41.85,
      memoryUsage: 59.0,
      storageUsage: 75.15,
    },
  };

  const mockUserPresence: UserPresenceResponseDto = {
    online: [
      {
        userId: 'user-1',
        username: 'john.doe',
        email: 'john@example.com',
        status: 'online',
        lastActivity: new Date(),
      },
    ],
    offline: [],
    away: [],
    total: 1,
    statistics: {
      onlineCount: 1,
      offlineCount: 0,
      awayCount: 0,
    },
  };

  const mockSystemHealth: SystemHealthResponseDto = {
    status: 'healthy',
    checks: [
      {
        name: 'database',
        status: 'healthy',
        message: 'Database connection is stable',
        lastCheck: new Date(),
      },
      {
        name: 'redis',
        status: 'healthy',
        message: 'Redis connection is stable',
        lastCheck: new Date(),
      },
    ],
    uptime: 86400,
    timestamp: new Date(),
  };

  const mockUpsStatus: UpsStatusResponseDto = {
    devices: [
      {
        id: 'ups-1',
        name: 'Main UPS',
        status: 'online',
        batteryLevel: 100,
        estimatedRuntime: 120,
        inputVoltage: 230,
        outputVoltage: 230,
        load: 45,
        temperature: 25,
        lastUpdate: new Date(),
      },
    ],
    summary: {
      total: 1,
      online: 1,
      onBattery: 0,
      offline: 0,
      averageBatteryLevel: 100,
      totalLoad: 45,
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

    controller = module.get<DashboardWidgetController>(DashboardWidgetController);
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
      const query: WidgetDataQueryDto = { limit: 10, offset: 0 };
      getActivityFeedUseCase.execute.mockResolvedValue(mockActivityFeed);

      const result = await controller.getActivityFeed(query);

      expect(result).toEqual(mockActivityFeed);
      expect(getActivityFeedUseCase.execute).toHaveBeenCalledWith(query);
    });

    it('should handle query with date range', async () => {
      const query: WidgetDataQueryDto = {
        limit: 20,
        offset: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      getActivityFeedUseCase.execute.mockResolvedValue(mockActivityFeed);

      const result = await controller.getActivityFeed(query);

      expect(result).toEqual(mockActivityFeed);
      expect(getActivityFeedUseCase.execute).toHaveBeenCalledWith(query);
    });
  });

  describe('getAlerts', () => {
    it('should return alerts data', async () => {
      const query: WidgetDataQueryDto = { limit: 10, offset: 0 };
      getAlertsUseCase.execute.mockResolvedValue(mockAlerts);

      const result = await controller.getAlerts(query);

      expect(result).toEqual(mockAlerts);
      expect(getAlertsUseCase.execute).toHaveBeenCalledWith(query);
    });

    it('should handle empty alerts', async () => {
      const query: WidgetDataQueryDto = { limit: 10, offset: 0 };
      const emptyAlerts: AlertsResponseDto = {
        alerts: [],
        total: 0,
        unacknowledged: 0,
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
        online: [],
        offline: [],
        away: [],
        total: 0,
        statistics: {
          onlineCount: 0,
          offlineCount: 0,
          awayCount: 0,
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
        checks: [
          {
            name: 'database',
            status: 'unhealthy',
            message: 'Database connection failed',
            lastCheck: new Date(),
          },
        ],
        uptime: 3600,
        timestamp: new Date(),
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
        devices: [],
        summary: {
          total: 0,
          online: 0,
          onBattery: 0,
          offline: 0,
          averageBatteryLevel: 0,
          totalLoad: 0,
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

      expect(exportWidgetDataUseCase.execute).toHaveBeenCalledWith(widgetId, query);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
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

      expect(exportWidgetDataUseCase.execute).toHaveBeenCalledWith(widgetId, query);
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