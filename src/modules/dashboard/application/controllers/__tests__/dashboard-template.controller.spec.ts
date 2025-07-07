import { Test, TestingModule } from '@nestjs/testing';
import { DashboardTemplateController } from '../dashboard-template.controller';
import {
  ListTemplatesUseCase,
  CreateLayoutFromTemplateUseCase,
} from '../../use-cases/templates';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  DashboardTemplateListResponseDto,
  CreateLayoutFromTemplateDto,
} from '../../dto/dashboard-template.dto';
import { DashboardLayoutResponseDto } from '../../dto/dashboard-layout.dto';

describe('DashboardTemplateController', () => {
  let controller: DashboardTemplateController;
  let listTemplatesUseCase: jest.Mocked<ListTemplatesUseCase>;
  let createLayoutFromTemplateUseCase: jest.Mocked<CreateLayoutFromTemplateUseCase>;

  const mockUser: JwtPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  const mockTemplates: DashboardTemplateListResponseDto = {
    templates: [
      {
        id: 'infrastructure',
        name: 'Infrastructure Overview',
        description: 'Monitor servers, VMs, and system resources',
        widgets: [
          {
            widgetType: 'system-health',
            position: { x: 0, y: 0, width: 6, height: 3 },
            config: {},
          },
          {
            widgetType: 'resource-usage',
            position: { x: 6, y: 0, width: 6, height: 3 },
            config: {},
          },
        ],
        previewUrl: '/templates/infrastructure.png',
        category: 'monitoring',
      },
      {
        id: 'team-activity',
        name: 'Team Activity',
        description: 'Track team activity and presence',
        widgets: [
          {
            widgetType: 'user-presence',
            position: { x: 0, y: 0, width: 4, height: 2 },
            config: {},
          },
          {
            widgetType: 'activity-feed',
            position: { x: 4, y: 0, width: 8, height: 2 },
            config: {},
          },
        ],
        previewUrl: '/templates/team-activity.png',
        category: 'collaboration',
      },
    ],
    categories: ['monitoring', 'collaboration'],
  };

  const mockLayout: DashboardLayoutResponseDto = {
    id: 'layout-1',
    name: 'Infrastructure Overview',
    widgets: [
      {
        widgetType: 'system-health',
        position: { x: 0, y: 0, width: 6, height: 3 },
        config: {},
      },
      {
        widgetType: 'resource-usage',
        position: { x: 6, y: 0, width: 6, height: 3 },
        config: {},
      },
    ],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardTemplateController],
      providers: [
        {
          provide: ListTemplatesUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: CreateLayoutFromTemplateUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardTemplateController>(
      DashboardTemplateController,
    );
    listTemplatesUseCase = module.get(ListTemplatesUseCase);
    createLayoutFromTemplateUseCase = module.get(
      CreateLayoutFromTemplateUseCase,
    );
  });

  describe('getTemplates', () => {
    it('should return list of available templates', async () => {
      listTemplatesUseCase.execute.mockResolvedValue(mockTemplates);

      const result = await controller.getTemplates();

      expect(result).toEqual(mockTemplates);
      expect(listTemplatesUseCase.execute).toHaveBeenCalled();
    });

    it('should handle empty template list', async () => {
      const emptyTemplates: DashboardTemplateListResponseDto = {
        templates: [],
        categories: [],
      };
      listTemplatesUseCase.execute.mockResolvedValue(emptyTemplates);

      const result = await controller.getTemplates();

      expect(result).toEqual(emptyTemplates);
      expect(listTemplatesUseCase.execute).toHaveBeenCalled();
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Failed to load templates');
      listTemplatesUseCase.execute.mockRejectedValue(error);

      await expect(controller.getTemplates()).rejects.toThrow(error);
    });
  });

  describe('createLayoutFromTemplate', () => {
    it('should create a layout from template', async () => {
      const createDto: CreateLayoutFromTemplateDto = {
        templateId: 'infrastructure',
        name: 'My Infrastructure Dashboard',
      };

      createLayoutFromTemplateUseCase.execute.mockResolvedValue(mockLayout);

      const result = await controller.createLayoutFromTemplate(
        mockUser,
        createDto,
      );

      expect(result).toEqual(mockLayout);
      expect(createLayoutFromTemplateUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        createDto,
      );
    });

    it('should use default name when not provided', async () => {
      const createDto: CreateLayoutFromTemplateDto = {
        templateId: 'team-activity',
      };

      const layoutWithDefaultName = {
        ...mockLayout,
        name: 'Team Activity',
      };
      createLayoutFromTemplateUseCase.execute.mockResolvedValue(
        layoutWithDefaultName,
      );

      const result = await controller.createLayoutFromTemplate(
        mockUser,
        createDto,
      );

      expect(result).toEqual(layoutWithDefaultName);
      expect(createLayoutFromTemplateUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        createDto,
      );
    });

    it('should handle template not found error', async () => {
      const createDto: CreateLayoutFromTemplateDto = {
        templateId: 'non-existent',
        name: 'Test Layout',
      };

      const error = new Error('Template not found');
      createLayoutFromTemplateUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createLayoutFromTemplate(mockUser, createDto),
      ).rejects.toThrow(error);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateLayoutFromTemplateDto = {
        templateId: '',
        name: 'Test Layout',
      };

      const error = new Error('Invalid template ID');
      createLayoutFromTemplateUseCase.execute.mockRejectedValue(error);

      await expect(
        controller.createLayoutFromTemplate(mockUser, createDto),
      ).rejects.toThrow(error);
    });
  });
});
