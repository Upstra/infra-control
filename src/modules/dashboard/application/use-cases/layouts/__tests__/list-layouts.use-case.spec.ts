import { ListLayoutsUseCase } from '../list-layouts.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayout } from '../../../../domain/entities/dashboard-layout.entity';
import { DashboardWidget, WidgetType } from '../../../../domain/entities/dashboard-widget.entity';

describe('ListLayoutsUseCase', () => {
  let useCase: ListLayoutsUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;

  beforeEach(() => {
    layoutRepository = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findByIdAndUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      setDefaultLayout: jest.fn(),
      unsetAllDefaultLayouts: jest.fn(),
    } as any;

    useCase = new ListLayoutsUseCase(layoutRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'user-123';
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty list when no layouts exist', async () => {
      layoutRepository.findByUserId.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        layouts: [],
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return single layout without widgets', async () => {
      const mockLayout = {
        id: 'layout-1',
        name: 'Empty Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        layouts: [
          {
            id: 'layout-1',
            name: 'Empty Layout',
            columns: 12,
            rowHeight: 80,
            isDefault: true,
            userId,
            widgets: [],
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return single layout with widgets', async () => {
      const mockWidget = {
        id: 'widget-1',
        type: WidgetType.SYSTEM_HEALTH,
        title: 'System Health',
        position: { x: 0, y: 0, w: 4, h: 3 },
        settings: { refreshRate: 5000 },
        refreshInterval: 30000,
        visible: true,
        layoutId: 'layout-1',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockLayout = {
        id: 'layout-1',
        name: 'Health Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [mockWidget],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        layouts: [
          {
            id: 'layout-1',
            name: 'Health Dashboard',
            columns: 12,
            rowHeight: 80,
            isDefault: true,
            userId,
            widgets: [
              {
                id: 'widget-1',
                type: 'system-health',
                title: 'System Health',
                position: { x: 0, y: 0, w: 4, h: 3 },
                settings: { refreshRate: 5000 },
                refreshInterval: 30000,
                visible: true,
              },
            ],
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return multiple layouts with mixed configurations', async () => {
      const mockWidget1 = {
        id: 'widget-1',
        type: WidgetType.SYSTEM_HEALTH,
        title: 'System Health',
        position: { x: 0, y: 0, w: 4, h: 3 },
        settings: { refreshRate: 5000 },
        refreshInterval: 30000,
        visible: true,
        layoutId: 'layout-1',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockWidget2 = {
        id: 'widget-2',
        type: WidgetType.ALERTS,
        title: 'Critical Alerts',
        position: { x: 4, y: 0, w: 4, h: 3 },
        settings: { severity: 'critical' },
        refreshInterval: 60000,
        visible: false,
        layoutId: 'layout-1',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockWidget3 = {
        id: 'widget-3',
        type: WidgetType.RESOURCE_USAGE,
        title: 'Resource Usage',
        position: { x: 0, y: 3, w: 6, h: 4 },
        settings: { metrics: ['cpu', 'memory'] },
        refreshInterval: 15000,
        visible: true,
        layoutId: 'layout-2',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockLayout1 = {
        id: 'layout-1',
        name: 'Main Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [mockWidget1, mockWidget2],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      const mockLayout2 = {
        id: 'layout-2',
        name: 'Resources Dashboard',
        userId,
        columns: 16,
        rowHeight: 100,
        isDefault: false,
        widgets: [mockWidget3],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      const mockLayout3 = {
        id: 'layout-3',
        name: 'Empty Dashboard',
        userId,
        columns: 8,
        rowHeight: 60,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout1, mockLayout2, mockLayout3]);

      const result = await useCase.execute(userId);

      expect(result.layouts).toHaveLength(3);
      expect(result.layouts[0]).toEqual({
        id: 'layout-1',
        name: 'Main Dashboard',
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        userId,
        widgets: [
          {
            id: 'widget-1',
            type: 'system-health',
            title: 'System Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: { refreshRate: 5000 },
            refreshInterval: 30000,
            visible: true,
          },
          {
            id: 'widget-2',
            type: 'alerts',
            title: 'Critical Alerts',
            position: { x: 4, y: 0, w: 4, h: 3 },
            settings: { severity: 'critical' },
            refreshInterval: 60000,
            visible: false,
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      expect(result.layouts[1]).toEqual({
        id: 'layout-2',
        name: 'Resources Dashboard',
        columns: 16,
        rowHeight: 100,
        isDefault: false,
        userId,
        widgets: [
          {
            id: 'widget-3',
            type: 'resource-usage',
            title: 'Resource Usage',
            position: { x: 0, y: 3, w: 6, h: 4 },
            settings: { metrics: ['cpu', 'memory'] },
            refreshInterval: 15000,
            visible: true,
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      expect(result.layouts[2]).toEqual({
        id: 'layout-3',
        name: 'Empty Dashboard',
        columns: 8,
        rowHeight: 60,
        isDefault: false,
        userId,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle layouts with all widget types', async () => {
      const widgets = [
        {
          id: 'widget-1',
          type: WidgetType.SYSTEM_HEALTH,
          title: 'System Health',
          position: { x: 0, y: 0, w: 4, h: 3 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'widget-2',
          type: WidgetType.ALERTS,
          title: 'Alerts',
          position: { x: 4, y: 0, w: 4, h: 3 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'widget-3',
          type: WidgetType.RESOURCE_USAGE,
          title: 'Resource Usage',
          position: { x: 8, y: 0, w: 4, h: 3 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'widget-4',
          type: WidgetType.ACTIVITY_FEED,
          title: 'Activity Feed',
          position: { x: 0, y: 3, w: 6, h: 4 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'widget-5',
          type: WidgetType.USER_PRESENCE,
          title: 'User Presence',
          position: { x: 6, y: 3, w: 6, h: 4 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
        {
          id: 'widget-6',
          type: WidgetType.UPS_STATUS,
          title: 'UPS Status',
          position: { x: 0, y: 7, w: 12, h: 2 },
          settings: {},
          refreshInterval: 30000,
          visible: true,
          layoutId: 'layout-1',
          layout: {} as any,
          createdAt: mockDate,
          updatedAt: mockDate,
        },
      ] as DashboardWidget[];

      const mockLayout = {
        id: 'layout-1',
        name: 'Complete Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result.layouts[0].widgets).toHaveLength(6);
      expect(result.layouts[0].widgets.map(w => w.type)).toEqual([
        'system-health',
        'alerts',
        'resource-usage',
        'activity-feed',
        'user-presence',
        'ups-status',
      ]);

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle widgets with undefined/null values', async () => {
      const mockWidget = {
        id: 'widget-1',
        type: WidgetType.SYSTEM_HEALTH,
        title: 'System Health',
        position: { x: 0, y: 0, w: 4, h: 3 },
        settings: null,
        refreshInterval: undefined,
        visible: true,
        layoutId: 'layout-1',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockLayout = {
        id: 'layout-1',
        name: 'Test Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [mockWidget],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result.layouts[0].widgets[0]).toEqual({
        id: 'widget-1',
        type: 'system-health',
        title: 'System Health',
        position: { x: 0, y: 0, w: 4, h: 3 },
        settings: null,
        refreshInterval: undefined,
        visible: true,
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle repository failure', async () => {
      layoutRepository.findByUserId.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(userId)).rejects.toThrow('Database error');

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle layouts with extreme widget configurations', async () => {
      const mockWidget = {
        id: 'widget-extreme',
        type: WidgetType.RESOURCE_USAGE,
        title: 'Extreme Widget',
        position: { x: 0, y: 0, w: 24, h: 20 },
        settings: { 
          complex: { 
            nested: { 
              value: 'test', 
              array: [1, 2, 3],
              object: { key: 'value' }
            }
          }
        },
        refreshInterval: 1000,
        visible: false,
        layoutId: 'layout-extreme',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockLayout = {
        id: 'layout-extreme',
        name: 'Extreme Layout',
        userId,
        columns: 24,
        rowHeight: 200,
        isDefault: false,
        widgets: [mockWidget],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result.layouts[0].widgets[0]).toEqual({
        id: 'widget-extreme',
        type: 'resource-usage',
        title: 'Extreme Widget',
        position: { x: 0, y: 0, w: 24, h: 20 },
        settings: { 
          complex: { 
            nested: { 
              value: 'test', 
              array: [1, 2, 3],
              object: { key: 'value' }
            }
          }
        },
        refreshInterval: 1000,
        visible: false,
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle layouts with special characters in names', async () => {
      const mockLayout = {
        id: 'layout-special',
        name: 'Dashboard-With_Special@Characters!',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result.layouts[0].name).toBe('Dashboard-With_Special@Characters!');
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle widgets with empty settings', async () => {
      const mockWidget = {
        id: 'widget-empty',
        type: WidgetType.ALERTS,
        title: 'Empty Settings Widget',
        position: { x: 0, y: 0, w: 4, h: 3 },
        settings: {},
        refreshInterval: 30000,
        visible: true,
        layoutId: 'layout-1',
        layout: {} as any,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardWidget;

      const mockLayout = {
        id: 'layout-1',
        name: 'Empty Settings Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [mockWidget],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([mockLayout]);

      const result = await useCase.execute(userId);

      expect(result.layouts[0].widgets[0].settings).toEqual({});
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should handle null layouts list', async () => {
      layoutRepository.findByUserId.mockResolvedValue(null as any);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        layouts: [],
      });
    });

    it('should handle large number of layouts', async () => {
      const largeLayoutList = Array.from({ length: 50 }, (_, i) => ({
        id: `layout-${i}`,
        name: `Layout ${i}`,
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: i === 0,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout));

      layoutRepository.findByUserId.mockResolvedValue(largeLayoutList);

      const result = await useCase.execute(userId);

      expect(result.layouts).toHaveLength(50);
      expect(result.layouts[0].isDefault).toBe(true);
      expect(result.layouts[1].isDefault).toBe(false);
    });
  });
});