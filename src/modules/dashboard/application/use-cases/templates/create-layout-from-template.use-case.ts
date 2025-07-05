import { Injectable, Inject } from '@nestjs/common';
import { DashboardLayout } from '../../../domain/entities/dashboard-layout.entity';
import { DashboardWidget } from '../../../domain/entities/dashboard-widget.entity';
import { IDashboardLayoutRepository } from '../../../domain/interfaces/dashboard-layout.repository.interface';
import { IDashboardTemplateRepository } from '../../../domain/interfaces/dashboard-template.repository.interface';
import {
  CreateLayoutFromTemplateDto,
  DashboardLayoutResponseDto,
} from '../../dto';
import {
  DashboardTemplateNotFoundException,
  DashboardLayoutNameAlreadyExistsException,
} from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class CreateLayoutFromTemplateUseCase {
  constructor(
    @Inject('DashboardLayoutRepository')
    private readonly layoutRepository: IDashboardLayoutRepository,
    @Inject('DashboardTemplateRepository')
    private readonly templateRepository: IDashboardTemplateRepository,
  ) {}

  async execute(
    userId: string,
    dto: CreateLayoutFromTemplateDto,
  ): Promise<DashboardLayoutResponseDto> {
    const template = await this.templateRepository.findById(dto.templateId);

    if (!template || !template.isActive) {
      throw new DashboardTemplateNotFoundException(dto.templateId);
    }

    const existingLayouts = await this.layoutRepository.findByUserId(userId);
    const nameExists = existingLayouts.some(
      (layout) => layout.name.toLowerCase() === dto.name.toLowerCase(),
    );

    if (nameExists) {
      throw new DashboardLayoutNameAlreadyExistsException(dto.name);
    }

    const layout = new DashboardLayout();
    layout.name = dto.name;
    layout.userId = userId;
    layout.columns = template.columns;
    layout.rowHeight = template.rowHeight;
    layout.isDefault = existingLayouts.length === 0;

    layout.widgets = template.widgets.map((templateWidget) => {
      const widget = new DashboardWidget();
      widget.type = templateWidget.type as any;
      widget.title = templateWidget.title;
      widget.position = { ...templateWidget.position };
      widget.settings = templateWidget.settings
        ? { ...templateWidget.settings }
        : undefined;
      widget.refreshInterval = templateWidget.refreshInterval;
      widget.visible = true;

      return widget;
    });

    const savedLayout = await this.layoutRepository.save(layout);

    return this.mapToResponseDto(savedLayout);
  }

  private mapToResponseDto(
    layout: DashboardLayout,
  ): DashboardLayoutResponseDto {
    return {
      id: layout.id,
      name: layout.name,
      columns: layout.columns,
      rowHeight: layout.rowHeight,
      isDefault: layout.isDefault,
      userId: layout.userId,
      widgets: layout.widgets.map((widget) => ({
        id: widget.id,
        type: widget.type,
        title: widget.title,
        position: widget.position,
        settings: widget.settings,
        refreshInterval: widget.refreshInterval,
        visible: widget.visible,
      })),
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    };
  }
}
