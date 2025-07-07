import { Injectable } from '@nestjs/common';
import { DashboardTemplateRepository } from '../../../infrastructure/repositories/dashboard-template.repository';
import { DashboardTemplateListResponseDto } from '../../dto/dashboard-template.dto';
import { WidgetType } from '../../../domain/entities/dashboard-widget.entity';

@Injectable()
export class ListTemplatesUseCase {
  constructor(
    private readonly templateRepository: DashboardTemplateRepository,
  ) {}

  async execute(): Promise<DashboardTemplateListResponseDto> {
    const templates = await this.templateRepository.findAll();

    return {
      templates: (templates ?? [])
        .filter((template) => template.isActive)
        .map((template) => ({
          id: template.id,
          name: template.name,
          description: template.description,
          preview: template.preview,
          widgets: template.widgets.map((widget) => ({
            type: widget.type as WidgetType,
            title: widget.title,
            position: widget.position,
            settings: widget.settings,
            refreshInterval: widget.refreshInterval,
          })),
        })),
    };
  }
}
