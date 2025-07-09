import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UpdateLayoutUseCase } from '../update-layout.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutDomainService } from '../../../../domain/services/dashboard-layout.domain.service';
import {
  DashboardWidget,
  WidgetType,
} from '../../../../domain/entities/dashboard-widget.entity';
import { DashboardLayout } from '../../../../domain/entities/dashboard-layout.entity';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
  DashboardLayoutNameAlreadyExistsException,
} from '../../../../domain/exceptions/dashboard.exception';
import { UpdateDashboardLayoutDto } from '../../../dto/dashboard-layout.dto';

describe('UpdateLayoutUseCase', () => {
  let useCase: UpdateLayoutUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;
  let layoutDomainService: jest.Mocked<DashboardLayoutDomainService>;
  let widgetRepository: jest.Mocked<Repository<DashboardWidget>>;

  const mockUserId = 'user-id';
  const mockLayoutId = 'layout-id';

  const createMockLayout = (
    overrides?: Partial<DashboardLayout>,
  ): DashboardLayout => {
    const layout = new DashboardLayout();
    layout.id = mockLayoutId;
    layout.userId = mockUserId;
    layout.name = 'My Dashboard';
    layout.columns = 12;
    layout.rowHeight = 50;
    layout.isDefault = false;
    layout.widgets = [];
    layout.createdAt = new Date();
    layout.updatedAt = new Date();
    Object.assign(layout, overrides);
    return layout;
  };

  const createMockWidget = (
    overrides?: Partial<DashboardWidget>,
  ): DashboardWidget => {
    const widget = new DashboardWidget();
    widget.id = 'widget-id';
    widget.type = WidgetType.STATS;
    widget.title = 'Stats Widget';
    widget.position = { x: 0, y: 0, w: 4, h: 3 };
    widget.settings = {};
    widget.refreshInterval = 30000;
    widget.visible = true;
    widget.layoutId = mockLayoutId;
    Object.assign(widget, overrides);
    return widget;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLayoutUseCase,
        {
          provide: DashboardLayoutRepository,
          useValue: {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DashboardLayoutDomainService,
          useValue: {
            validateWidgetPosition: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DashboardWidget),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<UpdateLayoutUseCase>(UpdateLayoutUseCase);
    layoutRepository = module.get(DashboardLayoutRepository);
    layoutDomainService = module.get(DashboardLayoutDomainService);
    widgetRepository = module.get(getRepositoryToken(DashboardWidget));
  });

  describe('execute', () => {
    it('should throw DashboardLayoutNotFoundException when layout does not exist', async () => {
      layoutRepository.findById.mockResolvedValue(null);

      await expect(
        useCase.execute(mockLayoutId, mockUserId, {}),
      ).rejects.toThrow(DashboardLayoutNotFoundException);
    });

    it('should throw UnauthorizedDashboardAccessException when user does not own the layout', async () => {
      const layout = createMockLayout({ userId: 'another-user' });
      layoutRepository.findById.mockResolvedValue(layout);

      await expect(
        useCase.execute(mockLayoutId, mockUserId, {}),
      ).rejects.toThrow(UnauthorizedDashboardAccessException);
    });

    it('should update layout name when provided', async () => {
      const layout = createMockLayout();
      const newName = 'Updated Dashboard';
      const dto: UpdateDashboardLayoutDto = { name: newName };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.findByUserId.mockResolvedValue([layout]);
      layoutRepository.save.mockResolvedValue({ ...layout, name: newName });

      const result = await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(result.name).toBe(newName);
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: newName }),
      );
    });

    it('should throw DashboardLayoutNameAlreadyExistsException when name already exists', async () => {
      const layout = createMockLayout();
      const existingLayout = createMockLayout({
        id: 'another-layout',
        name: 'Existing Dashboard',
      });
      const dto: UpdateDashboardLayoutDto = { name: 'Existing Dashboard' };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.findByUserId.mockResolvedValue([layout, existingLayout]);

      await expect(
        useCase.execute(mockLayoutId, mockUserId, dto),
      ).rejects.toThrow(DashboardLayoutNameAlreadyExistsException);
    });

    it('should update existing widgets when provided', async () => {
      const existingWidget = createMockWidget();
      const layout = createMockLayout({ widgets: [existingWidget] });
      const dto: UpdateDashboardLayoutDto = {
        widgets: [
          {
            id: existingWidget.id,
            type: WidgetType.ALERTS,
            title: 'Updated Widget',
            position: { x: 4, y: 0, w: 4, h: 3 },
            settings: { color: 'red' },
            refreshInterval: 60000,
            visible: false,
          },
        ],
      };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.save.mockResolvedValue(layout);

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(layoutDomainService.validateWidgetPosition).toHaveBeenCalled();
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              id: existingWidget.id,
              type: WidgetType.ALERTS,
              title: 'Updated Widget',
            }),
          ]),
        }),
      );
    });

    it('should create new widgets when no id is provided', async () => {
      const layout = createMockLayout();
      const dto: UpdateDashboardLayoutDto = {
        widgets: [
          {
            type: WidgetType.STATS,
            title: 'New Widget',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: {},
            refreshInterval: 30000,
            visible: true,
          },
        ],
      };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.save.mockResolvedValue(layout);

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(layoutDomainService.validateWidgetPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          type: WidgetType.STATS,
          title: 'New Widget',
          position: { x: 0, y: 0, w: 4, h: 3 },
        }),
        layout.columns,
      );
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              type: WidgetType.STATS,
              title: 'New Widget',
              layoutId: mockLayoutId,
            }),
          ]),
        }),
      );
    });

    it('should delete widgets that are not included in the update', async () => {
      const widget1 = createMockWidget({ id: 'widget-1' });
      const widget2 = createMockWidget({ id: 'widget-2' });
      const widget3 = createMockWidget({ id: 'widget-3' });
      const layout = createMockLayout({ widgets: [widget1, widget2, widget3] });

      const dto: UpdateDashboardLayoutDto = {
        widgets: [
          {
            id: widget1.id,
            type: widget1.type,
            title: widget1.title,
            position: widget1.position,
          },
          {
            id: widget3.id,
            type: widget3.type,
            title: widget3.title,
            position: widget3.position,
          },
        ],
      };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.save.mockResolvedValue(layout);
      widgetRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(widgetRepository.delete).toHaveBeenCalledWith(['widget-2']);
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ id: 'widget-1' }),
            expect.objectContaining({ id: 'widget-3' }),
          ]),
        }),
      );
      expect(layout.widgets).toHaveLength(2);
    });

    it('should handle empty widgets array by deleting all widgets', async () => {
      const widget1 = createMockWidget({ id: 'widget-1' });
      const widget2 = createMockWidget({ id: 'widget-2' });
      const layout = createMockLayout({ widgets: [widget1, widget2] });

      const dto: UpdateDashboardLayoutDto = {
        widgets: [],
      };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.save.mockResolvedValue(layout);
      widgetRepository.delete.mockResolvedValue({ affected: 2, raw: [] });

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(widgetRepository.delete).toHaveBeenCalledWith([
        'widget-1',
        'widget-2',
      ]);
      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: [],
        }),
      );
    });

    it('should not modify widgets when widgets array is not provided', async () => {
      const widget = createMockWidget();
      const layout = createMockLayout({ widgets: [widget] });
      const dto: UpdateDashboardLayoutDto = { name: 'New Name' };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.findByUserId.mockResolvedValue([layout]);
      layoutRepository.save.mockResolvedValue(layout);

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(widgetRepository.delete).not.toHaveBeenCalled();
      expect(layout.widgets).toHaveLength(1);
    });

    it('should maintain widget settings when not provided in update', async () => {
      const existingWidget = createMockWidget({
        settings: { originalSetting: 'value' },
        refreshInterval: 15000,
      });
      const layout = createMockLayout({ widgets: [existingWidget] });
      const dto: UpdateDashboardLayoutDto = {
        widgets: [
          {
            id: existingWidget.id,
            type: existingWidget.type,
            title: 'Updated Title',
            position: existingWidget.position,
          },
        ],
      };

      layoutRepository.findById.mockResolvedValue(layout);
      layoutRepository.save.mockResolvedValue(layout);

      await useCase.execute(mockLayoutId, mockUserId, dto);

      expect(layoutRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              settings: { originalSetting: 'value' },
              refreshInterval: 15000,
            }),
          ]),
        }),
      );
    });
  });
});
