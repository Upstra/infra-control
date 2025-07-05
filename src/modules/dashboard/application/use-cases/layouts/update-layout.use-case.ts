import { Injectable } from '@nestjs/common';
import { DashboardWidget } from '../../../domain/entities/dashboard-widget.entity';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import {
  UpdateDashboardLayoutDto,
  DashboardLayoutResponseDto,
} from '../../dto/dashboard-layout.dto';
import { DashboardLayoutDomainService } from '../../../domain/services/dashboard-layout.domain.service';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
  DashboardLayoutNameAlreadyExistsException,
} from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class UpdateLayoutUseCase {
  constructor(
    private readonly layoutRepository: DashboardLayoutRepository,
    private readonly layoutDomainService: DashboardLayoutDomainService,
  ) {}

  async execute(
    layoutId: string,
    userId: string,
    dto: UpdateDashboardLayoutDto,
  ): Promise<DashboardLayoutResponseDto> {
    const layout = await this.layoutRepository.findById(layoutId);

    if (!layout) {
      throw new DashboardLayoutNotFoundException(layoutId);
    }

    if (layout.userId !== userId) {
      throw new UnauthorizedDashboardAccessException(layoutId);
    }

    if (dto.name && dto.name !== layout.name) {
      const existingLayouts = await this.layoutRepository.findByUserId(userId);
      const nameExists = existingLayouts.some(
        (l) =>
          l.id !== layoutId && l.name.toLowerCase() === dto.name.toLowerCase(),
      );

      if (nameExists) {
        throw new DashboardLayoutNameAlreadyExistsException(dto.name);
      }

      layout.name = dto.name;
    }

    if (dto.widgets !== undefined) {
      const existingWidgetsMap = new Map(layout.widgets.map((w) => [w.id, w]));

      layout.widgets = dto.widgets.map((widgetDto) => {
        let widget: DashboardWidget;

        if (widgetDto.id && existingWidgetsMap.has(widgetDto.id)) {
          widget = existingWidgetsMap.get(widgetDto.id)!;
          widget.type = widgetDto.type;
          widget.title = widgetDto.title;
          widget.position = widgetDto.position;
          widget.settings = widgetDto.settings ?? widget.settings;
          widget.refreshInterval =
            widgetDto.refreshInterval ?? widget.refreshInterval;
          widget.visible = widgetDto.visible ?? widget.visible;
        } else {
          widget = new DashboardWidget();
          widget.type = widgetDto.type;
          widget.title = widgetDto.title;
          widget.position = widgetDto.position;
          widget.settings = widgetDto.settings;
          widget.refreshInterval = widgetDto.refreshInterval;
          widget.visible = widgetDto.visible ?? true;
        }

        this.layoutDomainService.validateWidgetPosition(widget, layout.columns);

        return widget;
      });
    }

    const savedLayout = await this.layoutRepository.save(layout);

    return this.mapToResponseDto(savedLayout);
  }

  private mapToResponseDto(layout: any): DashboardLayoutResponseDto {
    return {
      id: layout.id,
      name: layout.name,
      columns: layout.columns,
      rowHeight: layout.rowHeight,
      isDefault: layout.isDefault,
      userId: layout.userId,
      widgets: layout.widgets.map((widget: any) => ({
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
