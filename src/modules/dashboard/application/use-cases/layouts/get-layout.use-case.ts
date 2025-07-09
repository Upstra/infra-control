import { Injectable } from '@nestjs/common';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutResponseDto } from '../../dto/dashboard-layout.dto';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
} from '../../../domain/exceptions/dashboard.exception';

@Injectable()
export class GetLayoutUseCase {
  constructor(private readonly layoutRepository: DashboardLayoutRepository) {}

  async execute(
    layoutId: string,
    userId: string,
  ): Promise<DashboardLayoutResponseDto> {
    const layout = await this.layoutRepository.findById(layoutId);

    if (!layout) {
      throw new DashboardLayoutNotFoundException(layoutId);
    }

    if (layout.userId !== userId) {
      throw new UnauthorizedDashboardAccessException(layoutId);
    }

    return this.mapToResponseDto(layout);
  }

  private mapToResponseDto(layout: any): DashboardLayoutResponseDto {
    return {
      id: layout.id,
      name: layout.name,
      columns: layout.columns,
      rowHeight: layout.rowHeight,
      isDefault: layout.isDefault,
      userId: layout.userId,
      widgets:
        layout.widgets?.map((widget: any) => ({
          id: widget.id,
          type: widget.type,
          title: widget.title,
          position: widget.position,
          settings: widget.settings,
          refreshInterval: widget.refreshInterval,
          visible: widget.visible,
        })) ?? [],
      createdAt: layout.createdAt,
      updatedAt: layout.updatedAt,
    };
  }
}
