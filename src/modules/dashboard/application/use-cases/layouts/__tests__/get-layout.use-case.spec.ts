import { Test, TestingModule } from '@nestjs/testing';
import { GetLayoutUseCase } from '../get-layout.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
} from '../../../../domain/exceptions/dashboard.exception';
import { WidgetType } from '../../../../domain/entities/dashboard-widget.entity';

describe('GetLayoutUseCase', () => {
  let useCase: GetLayoutUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;

  const mockLayout = {
    id: 'layout-1',
    name: 'Test Layout',
    columns: 12,
    rowHeight: 80,
    isDefault: true,
    userId: 'user-1',
    widgets: [
      {
        id: 'widget-1',
        type: WidgetType.STATS,
        title: 'System Stats',
        position: { x: 0, y: 0, w: 6, h: 4 },
        settings: { theme: 'dark' },
        refreshInterval: 30000,
        visible: true,
      },
      {
        id: 'widget-2',
        type: WidgetType.ALERTS,
        title: 'Alerts',
        position: { x: 6, y: 0, w: 6, h: 4 },
        settings: null,
        refreshInterval: 60000,
        visible: false,
      },
    ],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T01:00:00Z'),
  };

  beforeEach(async () => {
    const mockLayoutRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLayoutUseCase,
        {
          provide: DashboardLayoutRepository,
          useValue: mockLayoutRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetLayoutUseCase>(GetLayoutUseCase);
    layoutRepository = module.get(DashboardLayoutRepository);
  });

  describe('execute', () => {
    it('should return layout successfully when layout exists and user is authorized', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      const result = await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(result).toEqual({
        id: 'layout-1',
        name: 'Test Layout',
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        userId: 'user-1',
        widgets: [
          {
            id: 'widget-1',
            type: WidgetType.STATS,
            title: 'System Stats',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: { theme: 'dark' },
            refreshInterval: 30000,
            visible: true,
          },
          {
            id: 'widget-2',
            type: WidgetType.ALERTS,
            title: 'Alerts',
            position: { x: 6, y: 0, w: 6, h: 4 },
            settings: null,
            refreshInterval: 60000,
            visible: false,
          },
        ],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T01:00:00Z'),
      });
    });

    it('should throw DashboardLayoutNotFoundException when layout does not exist', async () => {
      const layoutId = 'non-existent';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        DashboardLayoutNotFoundException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
    });

    it('should throw UnauthorizedDashboardAccessException when user is not the owner', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-2';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        UnauthorizedDashboardAccessException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
    });

    it('should handle layout with empty widgets array', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';
      const layoutWithoutWidgets = {
        ...mockLayout,
        widgets: [],
      };

      layoutRepository.findById.mockResolvedValue(layoutWithoutWidgets as any);

      const result = await useCase.execute(layoutId, userId);

      expect(result.widgets).toEqual([]);
    });

    it('should handle widgets with undefined settings', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';
      const layoutWithUndefinedSettings = {
        ...mockLayout,
        widgets: [
          {
            id: 'widget-1',
            type: WidgetType.STATS,
            title: 'Simple Widget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: undefined,
            refreshInterval: 30000,
            visible: true,
          },
        ],
      };

      layoutRepository.findById.mockResolvedValue(
        layoutWithUndefinedSettings as any,
      );

      const result = await useCase.execute(layoutId, userId);

      expect(result.widgets[0].settings).toBeUndefined();
    });

    it('should properly map all widget properties', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      const result = await useCase.execute(layoutId, userId);

      const widget = result.widgets[0];
      expect(widget).toHaveProperty('id');
      expect(widget).toHaveProperty('type');
      expect(widget).toHaveProperty('title');
      expect(widget).toHaveProperty('position');
      expect(widget).toHaveProperty('settings');
      expect(widget).toHaveProperty('refreshInterval');
      expect(widget).toHaveProperty('visible');
    });

    it('should properly map all layout properties', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      const result = await useCase.execute(layoutId, userId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('columns');
      expect(result).toHaveProperty('rowHeight');
      expect(result).toHaveProperty('isDefault');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('widgets');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should handle layout with null widgets array', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';
      const layoutWithNullWidgets = {
        ...mockLayout,
        widgets: null,
      };

      layoutRepository.findById.mockResolvedValue(layoutWithNullWidgets as any);

      const result = await useCase.execute(layoutId, userId);

      expect(result.widgets).toEqual([]);
    });

    it('should handle repository errors gracefully', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        'Database error',
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
    });
  });
});
