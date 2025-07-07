import { DashboardLayoutDomainService } from '../dashboard-layout.domain.service';
import { DashboardWidget } from '../../entities/dashboard-widget.entity';
import { InvalidWidgetPositionException } from '../../exceptions/dashboard.exception';

describe('DashboardLayoutDomainService', () => {
  let service: DashboardLayoutDomainService;

  beforeEach(() => {
    service = new DashboardLayoutDomainService();
  });

  describe('validateWidgetPosition', () => {
    it('should validate a valid widget position', () => {
      const widget = {
        position: { x: 0, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).not.toThrow();
    });

    it('should throw error when x is negative', () => {
      const widget = {
        position: { x: -1, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget position values must be positive',
      );
    });

    it('should throw error when y is negative', () => {
      const widget = {
        position: { x: 0, y: -1, w: 4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget position values must be positive',
      );
    });

    it('should throw error when width is zero', () => {
      const widget = {
        position: { x: 0, y: 0, w: 0, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget position values must be positive',
      );
    });

    it('should throw error when height is zero', () => {
      const widget = {
        position: { x: 0, y: 0, w: 4, h: 0 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget position values must be positive',
      );
    });

    it('should throw error when width is negative', () => {
      const widget = {
        position: { x: 0, y: 0, w: -4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
    });

    it('should throw error when height is negative', () => {
      const widget = {
        position: { x: 0, y: 0, w: 4, h: -3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
    });

    it('should throw error when widget exceeds layout columns', () => {
      const widget = {
        position: { x: 10, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        InvalidWidgetPositionException,
      );
      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget exceeds layout columns (14 > 12)',
      );
    });

    it('should allow widget that exactly fits layout columns', () => {
      const widget = {
        position: { x: 8, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).not.toThrow();
    });

    it('should handle edge case of single column layout', () => {
      const widget = {
        position: { x: 0, y: 0, w: 1, h: 1 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 1)).not.toThrow();
    });

    it('should throw error when widget position is at column boundary', () => {
      const widget = {
        position: { x: 12, y: 0, w: 1, h: 1 },
      } as DashboardWidget;

      expect(() => service.validateWidgetPosition(widget, 12)).toThrow(
        'Widget exceeds layout columns (13 > 12)',
      );
    });
  });

  describe('checkWidgetOverlap', () => {
    it('should return false when no widgets overlap', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 4, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-3',
          position: { x: 0, y: 3, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(false);
    });

    it('should return true when widgets overlap horizontally', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 2, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(true);
    });

    it('should return true when widgets overlap vertically', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 2, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(true);
    });

    it('should return true when new widget is completely inside existing widget', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 1, y: 1, w: 2, h: 2 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 4 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(true);
    });

    it('should return true when existing widget is completely inside new widget', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 0, w: 4, h: 4 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 1, y: 1, w: 2, h: 2 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(true);
    });

    it('should skip comparison with same widget ID', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-1',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(false);
    });

    it('should return false when widgets are adjacent horizontally', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 4, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(false);
    });

    it('should return false when widgets are adjacent vertically', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 3, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(false);
    });

    it('should handle empty existing widgets array', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 0, y: 0, w: 4, h: 3 },
      } as DashboardWidget;

      const result = service.checkWidgetOverlap(newWidget, []);
      expect(result).toBe(false);
    });

    it('should check overlap with multiple widgets and return true on first overlap', () => {
      const newWidget = {
        id: 'widget-1',
        position: { x: 2, y: 2, w: 4, h: 3 },
      } as DashboardWidget;

      const existingWidgets = [
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 2, h: 2 },
        } as DashboardWidget,
        {
          id: 'widget-3',
          position: { x: 0, y: 0, w: 4, h: 4 },
        } as DashboardWidget,
        {
          id: 'widget-4',
          position: { x: 10, y: 10, w: 2, h: 2 },
        } as DashboardWidget,
      ];

      const result = service.checkWidgetOverlap(newWidget, existingWidgets);
      expect(result).toBe(true);
    });
  });

  describe('optimizeWidgetLayout', () => {
    it('should optimize layout by removing vertical gaps', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 0, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-2',
          position: { x: 0, y: 10, w: 4, h: 2 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].position.y).toBe(0);
      expect(result[1].position.y).toBe(3);
    });

    it('should maintain horizontal positions', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 4, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-2',
          position: { x: 8, y: 10, w: 4, h: 2 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].position.x).toBe(4);
      expect(result[1].position.x).toBe(8);
    });

    it('should sort widgets by y position then x position', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 8, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-2',
          position: { x: 0, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-3',
          position: { x: 4, y: 0, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].id).toBe('widget-2');
      expect(result[1].id).toBe('widget-3');
      expect(result[2].id).toBe('widget-1');
    });

    it('should handle empty widgets array', () => {
      const result = service.optimizeWidgetLayout([]);
      expect(result).toEqual([]);
    });

    it('should handle single widget', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 4, y: 10, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].position.y).toBe(0);
      expect(result[0].position.x).toBe(4);
    });

    it('should not modify original widgets array', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 0, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const originalY = widgets[0].position.y;
      service.optimizeWidgetLayout(widgets);

      expect(widgets[0].position.y).toBe(originalY);
    });

    it('should create new widget objects with updated positions', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 0, y: 5, w: 4, h: 3 },
          type: 'alerts',
          title: 'Alerts',
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0]).not.toBe(widgets[0]);
      expect(result[0].position).not.toBe(widgets[0].position);
      expect(result[0].type).toBe('alerts');
      expect(result[0].title).toBe('Alerts');
    });

    it('should stack widgets vertically based on their heights', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 0, y: 0, w: 4, h: 2 },
        } as DashboardWidget,
        {
          id: 'widget-2',
          position: { x: 0, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-3',
          position: { x: 0, y: 10, w: 4, h: 1 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].position.y).toBe(0);
      expect(result[1].position.y).toBe(2);
      expect(result[2].position.y).toBe(5);
    });

    it('should handle widgets with same y position correctly', () => {
      const widgets = [
        {
          id: 'widget-1',
          position: { x: 8, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-2',
          position: { x: 0, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
        {
          id: 'widget-3',
          position: { x: 4, y: 5, w: 4, h: 3 },
        } as DashboardWidget,
      ];

      const result = service.optimizeWidgetLayout(widgets);

      expect(result[0].id).toBe('widget-2');
      expect(result[0].position.y).toBe(0);
      expect(result[1].id).toBe('widget-3');
      expect(result[1].position.y).toBe(3);
      expect(result[2].id).toBe('widget-1');
      expect(result[2].position.y).toBe(6);
    });
  });
});
