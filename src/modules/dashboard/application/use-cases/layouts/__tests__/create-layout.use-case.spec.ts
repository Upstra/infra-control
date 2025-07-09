import { CreateLayoutUseCase } from '../create-layout.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutDomainService } from '../../../../domain/services/dashboard-layout.domain.service';
import { DashboardLayoutNameAlreadyExistsException } from '../../../../domain/exceptions/dashboard.exception';
import { DashboardLayout } from '../../../../domain/entities/dashboard-layout.entity';
import {
  DashboardWidget,
  WidgetType,
} from '../../../../domain/entities/dashboard-widget.entity';
import { CreateDashboardLayoutDto } from '../../../dto/dashboard-layout.dto';

describe('CreateLayoutUseCase', () => {
  let useCase: CreateLayoutUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;
  let layoutDomainService: jest.Mocked<DashboardLayoutDomainService>;

  beforeEach(() => {
    layoutRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      unsetAllDefaultLayouts: jest.fn(),
    } as any;

    layoutDomainService = {
      validateWidgetPosition: jest.fn(),
    } as any;

    useCase = new CreateLayoutUseCase(layoutRepository, layoutDomainService);
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

    it('should create a layout with default values when minimal data provided', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'My Dashboard',
      };

      const mockSavedLayout = {
        id: 'layout-123',
        name: 'My Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      const result = await useCase.execute(userId, dto);

      expect(result).toEqual({
        id: 'layout-123',
        name: 'My Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      });

      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Dashboard',
          userId,
          columns: 12,
          rowHeight: 80,
          isDefault: true,
          widgets: [],
        }),
      );
    });

    it('should create a layout with custom values', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Custom Dashboard',
        columns: 16,
        rowHeight: 100,
        isDefault: false,
        widgets: [
          {
            type: WidgetType.SYSTEM_HEALTH,
            title: 'System Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: { refreshRate: 5000 },
            refreshInterval: 30000,
            visible: true,
          },
        ],
      };

      const mockSavedLayout = {
        id: 'layout-456',
        name: 'Custom Dashboard',
        userId,
        columns: 16,
        rowHeight: 100,
        isDefault: false,
        widgets: [
          {
            id: 'widget-123',
            type: WidgetType.SYSTEM_HEALTH,
            title: 'System Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: { refreshRate: 5000 },
            refreshInterval: 30000,
            visible: true,
            layoutId: 'layout-456',
            layout: {} as any,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ] as DashboardWidget[],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      const result = await useCase.execute(userId, dto);

      expect(result.columns).toBe(16);
      expect(result.rowHeight).toBe(100);
      expect(result.isDefault).toBe(false);
      expect(result.widgets).toHaveLength(1);
      expect(result.widgets[0]).toMatchObject({
        type: 'system-health',
        title: 'System Health',
      });

      expect(layoutDomainService.validateWidgetPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system-health',
          position: { x: 0, y: 0, w: 4, h: 3 },
        }),
        16,
      );
    });

    it('should throw error when layout name already exists', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Existing Dashboard',
      };

      const existingLayouts = [
        {
          id: 'existing-123',
          name: 'existing dashboard',
          userId,
        } as DashboardLayout,
      ];

      layoutRepository.findByUserId.mockResolvedValue(existingLayouts);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNameAlreadyExistsException,
      );

      expect(layoutRepository.save).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive name comparison', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'My DASHBOARD',
      };

      const existingLayouts = [
        {
          id: 'existing-123',
          name: 'my dashboard',
          userId,
        } as DashboardLayout,
      ];

      layoutRepository.findByUserId.mockResolvedValue(existingLayouts);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNameAlreadyExistsException,
      );
    });

    it('should set first layout as default when no existing layouts', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'First Dashboard',
        isDefault: false,
      };

      const mockSavedLayout = {
        id: 'layout-123',
        name: 'First Dashboard',
        userId,
        isDefault: true,
        widgets: [],
        columns: 12,
        rowHeight: 80,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      const result = await useCase.execute(userId, dto);

      expect(result.isDefault).toBe(true);
    });

    it('should unset other default layouts when creating a default layout', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'New Default',
        isDefault: true,
      };

      const existingLayouts = [
        {
          id: 'existing-123',
          name: 'Old Default',
          isDefault: true,
          userId,
        } as DashboardLayout,
      ];

      const mockSavedLayout = {
        id: 'layout-456',
        name: 'New Default',
        userId,
        isDefault: true,
        widgets: [],
        columns: 12,
        rowHeight: 80,
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue(existingLayouts);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      await useCase.execute(userId, dto);

      expect(layoutRepository.unsetAllDefaultLayouts).toHaveBeenCalledWith(
        userId,
      );
      expect(layoutRepository.unsetAllDefaultLayouts).toHaveBeenCalledWith(
        userId,
      );
      expect(layoutRepository.save).toHaveBeenCalled();
    });

    it('should create multiple widgets with proper validation', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Multi-Widget Dashboard',
        widgets: [
          {
            type: WidgetType.SYSTEM_HEALTH,
            title: 'Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
          },
          {
            type: WidgetType.ALERTS,
            title: 'Alerts',
            position: { x: 4, y: 0, w: 4, h: 3 },
            settings: { severity: 'critical' },
            refreshInterval: 60000,
            visible: false,
          },
        ],
      };

      const mockSavedLayout = {
        id: 'layout-789',
        name: 'Multi-Widget Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [
          {
            id: 'widget-1',
            type: WidgetType.SYSTEM_HEALTH,
            title: 'Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
            visible: true,
            layoutId: 'layout-789',
            layout: {} as any,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
          {
            id: 'widget-2',
            type: WidgetType.ALERTS,
            title: 'Alerts',
            position: { x: 4, y: 0, w: 4, h: 3 },
            settings: { severity: 'critical' },
            refreshInterval: 60000,
            visible: false,
            layoutId: 'layout-789',
            layout: {} as any,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ] as DashboardWidget[],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      const result = await useCase.execute(userId, dto);

      expect(result.widgets).toHaveLength(2);
      expect(layoutDomainService.validateWidgetPosition).toHaveBeenCalledTimes(
        2,
      );
      expect(result.widgets[0].visible).toBe(true);
      expect(result.widgets[1].visible).toBe(false);
    });

    it('should handle empty widgets array', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Empty Dashboard',
        widgets: [],
      };

      const mockSavedLayout = {
        id: 'layout-999',
        name: 'Empty Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      const result = await useCase.execute(userId, dto);

      expect(result.widgets).toEqual([]);
      expect(layoutDomainService.validateWidgetPosition).not.toHaveBeenCalled();
    });

    it('should handle widget validation errors', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Invalid Widget Dashboard',
        widgets: [
          {
            type: WidgetType.SYSTEM_HEALTH,
            title: 'Health',
            position: { x: 20, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
          },
        ],
      };

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutDomainService.validateWidgetPosition.mockImplementation(() => {
        throw new Error('Widget position invalid');
      });

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        'Widget position invalid',
      );

      expect(layoutRepository.save).not.toHaveBeenCalled();
    });

    it('should set visible to true by default for widgets', async () => {
      const dto: CreateDashboardLayoutDto = {
        name: 'Default Visible Dashboard',
        widgets: [
          {
            type: WidgetType.SYSTEM_HEALTH,
            title: 'Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
          },
        ],
      };

      const mockSavedLayout = {
        id: 'layout-visible',
        name: 'Default Visible Dashboard',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [
          {
            id: 'widget-vis',
            type: WidgetType.SYSTEM_HEALTH,
            title: 'Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
            visible: true,
            layoutId: 'layout-visible',
            layout: {} as any,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ] as DashboardWidget[],
        createdAt: mockDate,
        updatedAt: mockDate,
      } as DashboardLayout;

      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout);

      await useCase.execute(userId, dto);

      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              visible: true,
            }),
          ]),
        }),
      );
    });
  });
});
