import { Injectable, Inject } from '@nestjs/common';
import { IDashboardTemplateRepository } from '../../../domain/interfaces/dashboard-template.repository.interface';
import { DashboardTemplateListResponseDto } from '../../dto/dashboard-template.dto';

@Injectable()
export class ListTemplatesUseCase {
  constructor(
    @Inject('DashboardTemplateRepository')
    private readonly templateRepository: IDashboardTemplateRepository,
  ) {}

  async execute(): Promise<DashboardTemplateListResponseDto> {
    const templates = await this.templateRepository.findAll();

    return {
      templates: templates
        .filter((template) => template.isActive)
        .map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          preview: template.preview,
          widgets: template.widgets.map((widget) => ({
            type: widget.type as any,
            title: widget.title,
            position: widget.position,
            settings: widget.settings,
            refreshInterval: widget.refreshInterval,
          })),
        })),
    };
  }
}
