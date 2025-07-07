import { SetDefaultLayoutUseCase } from '../set-default-layout.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
} from '../../../../domain/exceptions/dashboard.exception';

describe('SetDefaultLayoutUseCase', () => {
  let useCase: SetDefaultLayoutUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;

  beforeEach(() => {
    layoutRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByIdAndUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      setDefaultLayout: jest.fn(),
      unsetAllDefaultLayouts: jest.fn(),
    } as any;

    useCase = new SetDefaultLayoutUseCase(layoutRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const layoutId = 'layout-123';
    const userId = 'user-456';
    const mockDate = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set default layout when layout exists and belongs to user', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Test Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should throw DashboardLayoutNotFoundException when layout does not exist', async () => {
      layoutRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        DashboardLayoutNotFoundException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedDashboardAccessException when layout belongs to different user', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Test Layout',
        userId: 'different-user',
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        UnauthorizedDashboardAccessException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
    });

    it('should handle layout that is already default', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Default Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: true,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle repository findById failure', async () => {
      layoutRepository.findById.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        'Database error',
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
    });

    it('should handle repository setDefaultLayout failure', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Test Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockRejectedValue(
        new Error('Update failed'),
      );

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        'Update failed',
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle layout with complex widget configuration', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Complex Layout',
        userId,
        columns: 16,
        rowHeight: 100,
        isDefault: false,
        widgets: [
          {
            id: 'widget-1',
            type: 'system-health',
            title: 'System Health',
            position: { x: 0, y: 0, w: 4, h: 3 },
            settings: { refreshRate: 5000 },
            refreshInterval: 30000,
            visible: true,
            layoutId,
            createdAt: mockDate,
            updatedAt: mockDate,
          },
        ],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle layout with minimum configuration', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Minimal Layout',
        userId,
        columns: 1,
        rowHeight: 20,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle layout with maximum configuration', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Maximum Layout',
        userId,
        columns: 24,
        rowHeight: 200,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle special characters in layout name', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Layout-With_Special@Characters!',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        layoutId,
        userId,
      );
    });

    it('should handle UUID format layout and user IDs', async () => {
      const uuidLayoutId = '550e8400-e29b-41d4-a716-446655440000';
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440001';

      const mockLayout = {
        id: uuidLayoutId,
        name: 'UUID Layout',
        userId: uuidUserId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await useCase.execute(uuidLayoutId, uuidUserId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(uuidLayoutId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        uuidLayoutId,
        uuidUserId,
      );
    });

    it('should handle concurrent access scenario', async () => {
      const mockLayout = {
        id: layoutId,
        name: 'Concurrent Layout',
        userId,
        columns: 12,
        rowHeight: 80,
        isDefault: false,
        widgets: [],
        createdAt: mockDate,
        updatedAt: mockDate,
      };

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.setDefaultLayout.mockResolvedValue(undefined);

      await Promise.all([
        useCase.execute(layoutId, userId),
        useCase.execute(layoutId, userId),
      ]);

      expect(layoutRepository.findById).toHaveBeenCalledTimes(2);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledTimes(2);
    });
  });
});
