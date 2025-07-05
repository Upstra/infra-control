import { Injectable } from '@nestjs/common';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutListResponseDto } from '../../dto/dashboard-layout.dto';

@Injectable()
export class ListLayoutsUseCase {
  constructor(private readonly layoutRepository: DashboardLayoutRepository) {}

  async execute(userId: string): Promise<DashboardLayoutListResponseDto> {
    const layouts = await this.layoutRepository.findByUserId(userId);

    return {
      layouts: layouts.map((layout) => ({
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
      })),
    };
  }
}
