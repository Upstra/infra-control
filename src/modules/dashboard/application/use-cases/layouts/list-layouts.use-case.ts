import { Injectable } from '@nestjs/common';
import { DashboardLayoutRepository } from '../../../infrastructure/repositories/dashboard-layout.repository';
import { DashboardLayoutListResponseDto } from '../../dto/dashboard-layout.dto';
import { DashboardLayoutDomainService } from '../../../domain/services/dashboard-layout.domain.service';
import { DashboardLayout } from '../../../domain/entities/dashboard-layout.entity';

export const DEFAULT_LAYOUT_NAME = 'Tableau principal';

@Injectable()
export class ListLayoutsUseCase {
  constructor(
    private readonly layoutRepository: DashboardLayoutRepository,
    private readonly layoutDomainService: DashboardLayoutDomainService,
  ) {}

  async execute(userId: string): Promise<DashboardLayoutListResponseDto> {
    const existing = await this.layoutRepository.findByUserId(userId);
    const layouts =
      existing && existing.length > 0
        ? existing
        : [await this.createDefaultLayout(userId)];

    return {
      layouts: (layouts ?? []).map((layout) => ({
        id: layout.id,
        name: layout.name,
        columns: layout.columns,
        rowHeight: layout.rowHeight,
        isDefault: layout.isDefault,
        userId: layout.userId,
        widgets: (layout.widgets ?? []).map((widget) => ({
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

  private async createDefaultLayout(userId: string): Promise<DashboardLayout> {
    const layout = new DashboardLayout();
    layout.name = DEFAULT_LAYOUT_NAME;
    layout.columns = 12;
    layout.rowHeight = 80;
    layout.isDefault = true;
    layout.userId = userId;
    layout.widgets = this.layoutDomainService.buildDefaultWidgets();
    return this.layoutRepository.save(layout);
  }
}
