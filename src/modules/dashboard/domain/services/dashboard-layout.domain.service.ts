import { Injectable } from '@nestjs/common';
import { DashboardWidget } from '../entities/dashboard-widget.entity';
import { InvalidWidgetPositionException } from '../exceptions/dashboard.exception';
import {
  DEFAULT_LAYOUT_WIDGETS,
  isValidOrderedPosition,
} from './dashboard-layout-rules';

@Injectable()
export class DashboardLayoutDomainService {
  validateWidgetPosition(widget: DashboardWidget, layoutColumns: number): void {
    if (!isValidOrderedPosition(widget.position)) {
      throw new InvalidWidgetPositionException(
        'Widget position must use x as a rank (integer >= 0) and w in 4, 6, 8 or 12',
      );
    }

    if (widget.position.w > layoutColumns) {
      throw new InvalidWidgetPositionException(
        `Widget wider than the layout (${widget.position.w} > ${layoutColumns})`,
      );
    }
  }

  buildDefaultWidgets(): DashboardWidget[] {
    return DEFAULT_LAYOUT_WIDGETS.map((definition, rank) => {
      const widget = new DashboardWidget();
      widget.type = definition.type;
      widget.title = definition.title;
      widget.position = { x: rank, y: 0, w: definition.w, h: 1 };
      widget.visible = true;
      return widget;
    });
  }

  checkWidgetOverlap(
    newWidget: DashboardWidget,
    existingWidgets: DashboardWidget[],
  ): boolean {
    for (const widget of existingWidgets) {
      if (widget.id === newWidget.id) continue;

      const overlap = this.doWidgetsOverlap(
        newWidget.position,
        widget.position,
      );
      if (overlap) {
        return true;
      }
    }
    return false;
  }

  private doWidgetsOverlap(
    pos1: { x: number; y: number; w: number; h: number },
    pos2: { x: number; y: number; w: number; h: number },
  ): boolean {
    return !(
      pos1.x + pos1.w <= pos2.x ||
      pos2.x + pos2.w <= pos1.x ||
      pos1.y + pos1.h <= pos2.y ||
      pos2.y + pos2.h <= pos1.y
    );
  }

  optimizeWidgetLayout(widgets: DashboardWidget[]): DashboardWidget[] {
    const sortedWidgets = [...widgets].sort((a, b) => {
      if (a.position.y !== b.position.y) {
        return a.position.y - b.position.y;
      }
      return a.position.x - b.position.x;
    });

    const optimizedWidgets: DashboardWidget[] = [];
    let currentY = 0;

    for (const widget of sortedWidgets) {
      const optimizedWidget = { ...widget };
      optimizedWidget.position = { ...widget.position, y: currentY };
      optimizedWidgets.push(optimizedWidget);

      const rowHeight = this.getRowHeightForWidget(optimizedWidget);
      currentY += rowHeight;
    }

    return optimizedWidgets;
  }

  private getRowHeightForWidget(widget: DashboardWidget): number {
    return widget.position.h;
  }
}
