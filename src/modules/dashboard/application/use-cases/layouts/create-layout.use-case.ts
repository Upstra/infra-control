import { Injectable } from '@nestjs/common';
import { DashboardLayout } from '../../../domain/entities/dashboard-layout.entity';
import { DashboardWidget } from '../../../domain/entities/dashboard-widget.entity';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import {
  CreateDashboardLayoutDto,
  DashboardLayoutResponseDto,
} from '../../dto/dashboard-layout.dto';
import { DashboardLayoutDomainService } from '../../../domain/services/dashboard-layout.domain.service';
import { DashboardLayoutNameAlreadyExistsException } from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class CreateLayoutUseCase {
  constructor(
    private readonly layoutRepository: DashboardLayoutRepository,
    private readonly layoutDomainService: DashboardLayoutDomainService,
  ) {}

  async execute(
    userId: string,
    dto: CreateDashboardLayoutDto,
  ): Promise<DashboardLayoutResponseDto> {
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
    layout.columns = dto.columns ?? 12;
    layout.rowHeight = dto.rowHeight ?? 80;
    layout.isDefault = existingLayouts.length === 0;
    if (dto.isDefault !== undefined) {
      layout.isDefault = dto.isDefault;
      if (dto.isDefault) {
        await this.layoutRepository.unsetAllDefaultLayouts(userId);
      }
    } else {
      layout.isDefault = existingLayouts.length === 0;
    }

    if (dto.widgets && dto.widgets.length > 0) {
      layout.widgets = dto.widgets.map((widgetDto) => {
        const widget = new DashboardWidget();
        widget.type = widgetDto.type;
        widget.title = widgetDto.title;
        widget.position = widgetDto.position;
        widget.settings = widgetDto.settings;
        widget.refreshInterval = widgetDto.refreshInterval;
        widget.visible = widgetDto.visible ?? true;

        this.layoutDomainService.validateWidgetPosition(widget, layout.columns);

        return widget;
      });
    } else {
      layout.widgets = [];
    }

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
