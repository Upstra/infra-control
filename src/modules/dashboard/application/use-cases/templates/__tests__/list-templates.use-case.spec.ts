import { Test, TestingModule } from '@nestjs/testing';
import { ListTemplatesUseCase } from '../list-templates.use-case';
import { DashboardTemplateRepository } from '../../../../infrastructure/repositories/dashboard-template.repository';
import { WidgetType } from '../../../../domain/entities/dashboard-widget.entity';

describe('ListTemplatesUseCase', () => {
  let useCase: ListTemplatesUseCase;
  let templateRepository: jest.Mocked<DashboardTemplateRepository>;

  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Default Template',
      description: 'Standard dashboard layout',
      preview: 'preview-url-1',
      isActive: true,
      widgets: [
        {
          type: WidgetType.STATS,
          title: 'System Stats',
          position: { x: 0, y: 0, w: 6, h: 4 },
          settings: { theme: 'dark' },
          refreshInterval: 30000,
        },
      ],
    },
    {
      id: 'template-2',
      name: 'Monitoring Template',
      description: 'Advanced monitoring layout',
      preview: 'preview-url-2',
      isActive: true,
      widgets: [
        {
          type: WidgetType.ALERTS,
          title: 'Alerts',
          position: { x: 0, y: 0, w: 12, h: 3 },
          settings: null,
          refreshInterval: 60000,
        },
        {
          type: WidgetType.RESOURCE_USAGE,
          title: 'Resource Usage',
          position: { x: 0, y: 3, w: 6, h: 4 },
          settings: { showHistory: true },
          refreshInterval: 5000,
        },
      ],
    },
    {
      id: 'template-3',
      name: 'Inactive Template',
      description: 'This template is inactive',
      preview: 'preview-url-3',
      isActive: false,
      widgets: [],
    },
  ];

  beforeEach(async () => {
    const mockTemplateRepository = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListTemplatesUseCase,
        {
          provide: DashboardTemplateRepository,
          useValue: mockTemplateRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListTemplatesUseCase>(ListTemplatesUseCase);
    templateRepository = module.get(DashboardTemplateRepository);
  });

  describe('execute', () => {
    it('should return only active templates', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      const result = await useCase.execute();

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].id).toBe('template-1');
      expect(result.templates[1].id).toBe('template-2');
    });

    it('should map template data correctly', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      const result = await useCase.execute();

      expect(result.templates[0]).toEqual({
        id: 'template-1',
        name: 'Default Template',
        description: 'Standard dashboard layout',
        preview: 'preview-url-1',
        widgets: [
          {
            type: WidgetType.STATS,
            title: 'System Stats',
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: { theme: 'dark' },
            refreshInterval: 30000,
          },
        ],
      });
    });

    it('should handle templates with multiple widgets', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      const result = await useCase.execute();

      expect(result.templates[1].widgets).toHaveLength(2);
      expect(result.templates[1].widgets[0].type).toBe(WidgetType.ALERTS);
      expect(result.templates[1].widgets[1].type).toBe(WidgetType.RESOURCE_USAGE);
    });

    it('should handle templates with null widget settings', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      const result = await useCase.execute();

      expect(result.templates[1].widgets[0].settings).toBeNull();
    });

    it('should handle empty template list', async () => {
      templateRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.templates).toEqual([]);
    });

    it('should handle all inactive templates', async () => {
      const inactiveTemplates = mockTemplates.map(t => ({ ...t, isActive: false }));
      templateRepository.findAll.mockResolvedValue(inactiveTemplates as any);

      const result = await useCase.execute();

      expect(result.templates).toEqual([]);
    });

    it('should call repository findAll method', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      await useCase.execute();

      expect(templateRepository.findAll).toHaveBeenCalledTimes(1);
      expect(templateRepository.findAll).toHaveBeenCalledWith();
    });
  });
});