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

    it('should handle repository errors gracefully', async () => {
      templateRepository.findAll.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute()).rejects.toThrow('Database error');

      expect(templateRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle null template list', async () => {
      templateRepository.findAll.mockResolvedValue(null as any);

      const result = await useCase.execute();

      expect(result.templates).toEqual([]);
    });

    it('should handle templates with empty widget arrays', async () => {
      const templatesWithEmptyWidgets = [
        {
          id: 'template-empty',
          name: 'Empty Template',
          description: 'Template with no widgets',
          preview: 'preview-empty',
          isActive: true,
          widgets: [],
        },
      ];

      templateRepository.findAll.mockResolvedValue(templatesWithEmptyWidgets as any);

      const result = await useCase.execute();

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].widgets).toEqual([]);
    });

    it('should handle templates with undefined widget settings', async () => {
      const templatesWithUndefinedSettings = [
        {
          id: 'template-undefined',
          name: 'Undefined Settings Template',
          description: 'Template with undefined settings',
          preview: 'preview-undefined',
          isActive: true,
          widgets: [
            {
              type: WidgetType.STATS,
              title: 'Widget Without Settings',
              position: { x: 0, y: 0, w: 6, h: 4 },
              settings: undefined,
              refreshInterval: 30000,
            },
          ],
        },
      ];

      templateRepository.findAll.mockResolvedValue(templatesWithUndefinedSettings as any);

      const result = await useCase.execute();

      expect(result.templates[0].widgets[0].settings).toBeUndefined();
    });

    it('should handle mixed active and inactive templates', async () => {
      const mixedTemplates = [
        { ...mockTemplates[0], isActive: true },
        { ...mockTemplates[1], isActive: false },
        { ...mockTemplates[2], isActive: true },
      ];

      templateRepository.findAll.mockResolvedValue(mixedTemplates as any);

      const result = await useCase.execute();

      expect(result.templates).toHaveLength(2);
      expect(result.templates[0].id).toBe('template-1');
      expect(result.templates[1].id).toBe('template-3');
    });

    it('should maintain widget property structure', async () => {
      templateRepository.findAll.mockResolvedValue(mockTemplates as any);

      const result = await useCase.execute();

      const widget = result.templates[0].widgets[0];
      expect(widget).toHaveProperty('type');
      expect(widget).toHaveProperty('title');
      expect(widget).toHaveProperty('position');
      expect(widget).toHaveProperty('settings');
      expect(widget).toHaveProperty('refreshInterval');
    });

    it('should handle large number of templates', async () => {
      const largeTemplateList = Array.from({ length: 100 }, (_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        description: `Description ${i}`,
        preview: `preview-${i}`,
        isActive: true,
        widgets: [
          {
            type: WidgetType.STATS,
            title: `Widget ${i}`,
            position: { x: 0, y: 0, w: 6, h: 4 },
            settings: { id: i },
            refreshInterval: 30000,
          },
        ],
      }));

      templateRepository.findAll.mockResolvedValue(largeTemplateList as any);

      const result = await useCase.execute();

      expect(result.templates).toHaveLength(100);
    });
  });
});