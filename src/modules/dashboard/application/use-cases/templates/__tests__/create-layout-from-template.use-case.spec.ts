import { Test, TestingModule } from '@nestjs/testing';
import { CreateLayoutFromTemplateUseCase } from '../create-layout-from-template.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardTemplateRepository } from '../../../../infrastructure/repositories/dashboard-template.repository';
import {
  DashboardTemplateNotFoundException,
  DashboardLayoutNameAlreadyExistsException,
} from '../../../../domain/exceptions/dashboard.exception';
import { WidgetType } from '../../../../domain/entities/dashboard-widget.entity';

describe('CreateLayoutFromTemplateUseCase', () => {
  let useCase: CreateLayoutFromTemplateUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;
  let templateRepository: jest.Mocked<DashboardTemplateRepository>;

  const mockTemplate = {
    id: 'template-1',
    name: 'Default Template',
    isActive: true,
    columns: 12,
    rowHeight: 80,
    widgets: [
      {
        type: WidgetType.STATS,
        title: 'System Stats',
        position: { x: 0, y: 0, w: 6, h: 4 },
        settings: { theme: 'dark' },
        refreshInterval: 30000,
      },
      {
        type: WidgetType.ALERTS,
        title: 'Alerts',
        position: { x: 6, y: 0, w: 6, h: 4 },
        settings: null,
        refreshInterval: 60000,
      },
    ],
  };

  const mockExistingLayout = {
    id: 'layout-1',
    name: 'Existing Layout',
    userId: 'user-1',
    columns: 12,
    rowHeight: 80,
    isDefault: false,
  };

  const mockSavedLayout = {
    id: 'layout-2',
    name: 'New Layout',
    userId: 'user-1',
    columns: 12,
    rowHeight: 80,
    isDefault: true,
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
        settings: undefined,
        refreshInterval: 60000,
        visible: true,
      },
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockLayoutRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
    };

    const mockTemplateRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLayoutFromTemplateUseCase,
        {
          provide: DashboardLayoutRepository,
          useValue: mockLayoutRepository,
        },
        {
          provide: DashboardTemplateRepository,
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateLayoutFromTemplateUseCase>(
      CreateLayoutFromTemplateUseCase,
    );
    layoutRepository = module.get(DashboardLayoutRepository);
    templateRepository = module.get(DashboardTemplateRepository);
  });

  describe('execute', () => {
    it('should create layout from template successfully', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue(mockSavedLayout as any);

      const result = await useCase.execute(userId, dto);

      expect(templateRepository.findById).toHaveBeenCalledWith('template-1');
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith('user-1');
      expect(layoutRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'layout-2',
        name: 'New Layout',
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
            settings: undefined,
            refreshInterval: 60000,
            visible: true,
          },
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    });

    it('should set isDefault to false when user has existing layouts', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockExistingLayout,
      ] as any);
      layoutRepository.save.mockResolvedValue({
        ...mockSavedLayout,
        isDefault: false,
      } as any);

      await useCase.execute(userId, dto);

      const savedLayoutCall = layoutRepository.save.mock.calls[0][0];
      expect(savedLayoutCall.isDefault).toBe(false);
    });

    it('should throw DashboardTemplateNotFoundException when template not found', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardTemplateNotFoundException,
      );
    });

    it('should throw DashboardTemplateNotFoundException when template is inactive', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      } as any);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardTemplateNotFoundException,
      );
    });

    it('should throw DashboardLayoutNameAlreadyExistsException when name exists', async () => {
      const dto = { templateId: 'template-1', name: 'Existing Layout' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockExistingLayout,
      ] as any);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNameAlreadyExistsException,
      );
    });

    it('should handle case-insensitive name comparison', async () => {
      const dto = { templateId: 'template-1', name: 'EXISTING LAYOUT' };
      const userId = 'user-1';

      templateRepository.findById.mockResolvedValue(mockTemplate as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockExistingLayout,
      ] as any);

      await expect(useCase.execute(userId, dto)).rejects.toThrow(
        DashboardLayoutNameAlreadyExistsException,
      );
    });

    it('should handle widgets without settings', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      const templateWithoutSettings = {
        ...mockTemplate,
        widgets: [
          {
            type: WidgetType.STATS,
            title: 'Simple Widget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: null,
            refreshInterval: 30000,
          },
        ],
      };

      templateRepository.findById.mockResolvedValue(
        templateWithoutSettings as any,
      );
      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue({
        ...mockSavedLayout,
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
      } as any);

      const result = await useCase.execute(userId, dto);

      expect(result.widgets[0].settings).toBeUndefined();
    });

    it('should handle widgets with undefined settings', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      const templateWithUndefinedSettings = {
        ...mockTemplate,
        widgets: [
          {
            type: WidgetType.STATS,
            title: 'Simple Widget',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: undefined,
            refreshInterval: 30000,
          },
        ],
      };

      templateRepository.findById.mockResolvedValue(
        templateWithUndefinedSettings as any,
      );
      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue({
        ...mockSavedLayout,
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
      } as any);

      const result = await useCase.execute(userId, dto);

      expect(result.widgets[0].settings).toBeUndefined();
    });

    it('should handle templates with empty widgets array', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';

      const templateWithEmptyWidgets = {
        ...mockTemplate,
        widgets: [],
      };

      templateRepository.findById.mockResolvedValue(
        templateWithEmptyWidgets as any,
      );
      layoutRepository.findByUserId.mockResolvedValue([]);
      layoutRepository.save.mockResolvedValue({
        ...mockSavedLayout,
        widgets: [],
      } as any);

      const result = await useCase.execute(userId, dto);

      expect(result.widgets).toEqual([]);
    });

    it('should properly clone widget position and settings objects', async () => {
      const dto = { templateId: 'template-1', name: 'New Layout' };
      const userId = 'user-1';
      const originalPosition = { x: 0, y: 0, w: 6, h: 4 };
      const originalSettings = { theme: 'dark', option: 'value' };

      const templateWithObjects = {
        ...mockTemplate,
        widgets: [
          {
            type: WidgetType.STATS,
            title: 'Test Widget',
            position: originalPosition,
            settings: originalSettings,
            refreshInterval: 30000,
          },
        ],
      };

      templateRepository.findById.mockResolvedValue(templateWithObjects as any);
      layoutRepository.findByUserId.mockResolvedValue([]);

      let capturedLayout: any;
      layoutRepository.save.mockImplementation((layout) => {
        capturedLayout = layout;
        return Promise.resolve({
          ...mockSavedLayout,
          widgets: layout.widgets.map((w: any, index: number) => ({
            ...w,
            id: `widget-${index + 1}`,
          })),
        } as any);
      });

      await useCase.execute(userId, dto);

      expect(capturedLayout.widgets[0].position).not.toBe(originalPosition);
      expect(capturedLayout.widgets[0].settings).not.toBe(originalSettings);
      expect(capturedLayout.widgets[0].position).toEqual(originalPosition);
      expect(capturedLayout.widgets[0].settings).toEqual(originalSettings);
    });
  });
});
