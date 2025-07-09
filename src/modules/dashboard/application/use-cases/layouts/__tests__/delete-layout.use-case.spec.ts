import { Test, TestingModule } from '@nestjs/testing';
import { DeleteLayoutUseCase } from '../delete-layout.use-case';
import { DashboardLayoutRepository } from '../../../../infrastructure/repositories/dashboard-layout.repository';
import {
  DashboardLayoutNotFoundException,
  UnauthorizedDashboardAccessException,
} from '../../../../domain/exceptions/dashboard.exception';

describe('DeleteLayoutUseCase', () => {
  let useCase: DeleteLayoutUseCase;
  let layoutRepository: jest.Mocked<DashboardLayoutRepository>;

  const mockLayout = {
    id: 'layout-1',
    name: 'Test Layout',
    userId: 'user-1',
    isDefault: false,
    columns: 12,
    rowHeight: 80,
  };

  const mockDefaultLayout = {
    id: 'layout-2',
    name: 'Default Layout',
    userId: 'user-1',
    isDefault: true,
    columns: 12,
    rowHeight: 80,
  };

  const mockOtherLayout = {
    id: 'layout-3',
    name: 'Other Layout',
    userId: 'user-1',
    isDefault: false,
    columns: 12,
    rowHeight: 80,
  };

  beforeEach(async () => {
    const mockLayoutRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      setDefaultLayout: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteLayoutUseCase,
        {
          provide: DashboardLayoutRepository,
          useValue: mockLayoutRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteLayoutUseCase>(DeleteLayoutUseCase);
    layoutRepository = module.get(DashboardLayoutRepository);
  });

  describe('execute', () => {
    it('should delete non-default layout successfully', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).not.toHaveBeenCalled();
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
    });

    it('should throw DashboardLayoutNotFoundException when layout not found', async () => {
      const layoutId = 'non-existent';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        DashboardLayoutNotFoundException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedDashboardAccessException when user is not owner', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-2';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        UnauthorizedDashboardAccessException,
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle deleting default layout with other layouts available', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockDefaultLayout,
        mockOtherLayout,
      ] as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        mockOtherLayout.id,
        userId,
      );
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });

    it('should handle deleting default layout when it is the only layout', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockDefaultLayout,
      ] as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });

    it('should handle deleting default layout when no other layouts exist', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockDefaultLayout,
      ] as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });

    it('should select first available other layout as new default', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';
      const firstOtherLayout = { ...mockOtherLayout, id: 'layout-3' };
      const secondOtherLayout = { ...mockOtherLayout, id: 'layout-4' };

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue([
        mockDefaultLayout,
        firstOtherLayout,
        secondOtherLayout,
      ] as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.setDefaultLayout).toHaveBeenCalledWith(
        firstOtherLayout.id,
        userId,
      );
    });

    it('should handle deleting default layout when findByUserId returns empty array', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue([]);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });

    it('should handle deleting default layout when findByUserId returns null', async () => {
      const layoutId = 'layout-2';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockDefaultLayout as any);
      layoutRepository.findByUserId.mockResolvedValue(null as any);

      await useCase.execute(layoutId, userId);

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(layoutRepository.setDefaultLayout).not.toHaveBeenCalled();
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });

    it('should handle repository errors gracefully', async () => {
      const layoutId = 'layout-1';
      const userId = 'user-1';

      layoutRepository.findById.mockResolvedValue(mockLayout as any);
      layoutRepository.delete.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(layoutId, userId)).rejects.toThrow(
        'Database error',
      );

      expect(layoutRepository.findById).toHaveBeenCalledWith(layoutId);
      expect(layoutRepository.delete).toHaveBeenCalledWith(layoutId);
    });
  });
});
