import { Test, TestingModule } from '@nestjs/testing';
import { DashboardLayoutController } from '../dashboard-layout.controller';
import {
  CreateLayoutUseCase,
  UpdateLayoutUseCase,
  DeleteLayoutUseCase,
  GetLayoutUseCase,
  ListLayoutsUseCase,
  SetDefaultLayoutUseCase,
} from '../../use-cases/layouts';
import { JwtPayload } from '@/core/types/jwt-payload.interface';
import {
  CreateDashboardLayoutDto,
  UpdateDashboardLayoutDto,
  DashboardLayoutResponseDto,
  DashboardLayoutListResponseDto,
} from '../../dto/dashboard-layout.dto';
import { DashboardLayout } from '@/modules/dashboard/domain/entities/dashboard-layout.entity';
import { WidgetPosition } from '@/modules/dashboard/domain/value-objects/widget-position.vo';

describe('DashboardLayoutController', () => {
  let controller: DashboardLayoutController;
  let createLayoutUseCase: jest.Mocked<CreateLayoutUseCase>;
  let updateLayoutUseCase: jest.Mocked<UpdateLayoutUseCase>;
  let deleteLayoutUseCase: jest.Mocked<DeleteLayoutUseCase>;
  let getLayoutUseCase: jest.Mocked<GetLayoutUseCase>;
  let listLayoutsUseCase: jest.Mocked<ListLayoutsUseCase>;
  let setDefaultLayoutUseCase: jest.Mocked<SetDefaultLayoutUseCase>;

  const mockUser: JwtPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
  };

  const mockLayout: DashboardLayoutResponseDto = {
    id: 'layout-1',
    name: 'Test Layout',
    widgets: [
      {
        widgetType: 'stats',
        position: new WidgetPosition(0, 0, 4, 2),
        config: {},
      },
    ],
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLayoutList: DashboardLayoutListResponseDto = {
    layouts: [mockLayout],
    total: 1,
    defaultLayoutId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardLayoutController],
      providers: [
        {
          provide: CreateLayoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: UpdateLayoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: DeleteLayoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: GetLayoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: ListLayoutsUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: SetDefaultLayoutUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardLayoutController>(DashboardLayoutController);
    createLayoutUseCase = module.get(CreateLayoutUseCase);
    updateLayoutUseCase = module.get(UpdateLayoutUseCase);
    deleteLayoutUseCase = module.get(DeleteLayoutUseCase);
    getLayoutUseCase = module.get(GetLayoutUseCase);
    listLayoutsUseCase = module.get(ListLayoutsUseCase);
    setDefaultLayoutUseCase = module.get(SetDefaultLayoutUseCase);
  });

  describe('getLayouts', () => {
    it('should return list of layouts for the current user', async () => {
      listLayoutsUseCase.execute.mockResolvedValue(mockLayoutList);

      const result = await controller.getLayouts(mockUser);

      expect(result).toEqual(mockLayoutList);
      expect(listLayoutsUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should handle empty layout list', async () => {
      const emptyList: DashboardLayoutListResponseDto = {
        layouts: [],
        total: 0,
        defaultLayoutId: null,
      };
      listLayoutsUseCase.execute.mockResolvedValue(emptyList);

      const result = await controller.getLayouts(mockUser);

      expect(result).toEqual(emptyList);
      expect(listLayoutsUseCase.execute).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should propagate errors from use case', async () => {
      const error = new Error('Failed to fetch layouts');
      listLayoutsUseCase.execute.mockRejectedValue(error);

      await expect(controller.getLayouts(mockUser)).rejects.toThrow(error);
    });
  });

  describe('getLayout', () => {
    it('should return a specific layout', async () => {
      const layoutId = 'layout-1';
      getLayoutUseCase.execute.mockResolvedValue(mockLayout);

      const result = await controller.getLayout(mockUser, layoutId);

      expect(result).toEqual(mockLayout);
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(layoutId, mockUser.userId);
    });

    it('should handle layout not found', async () => {
      const layoutId = 'non-existent';
      const error = new Error('Layout not found');
      getLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.getLayout(mockUser, layoutId)).rejects.toThrow(error);
    });
  });

  describe('createLayout', () => {
    it('should create a new layout', async () => {
      const createDto: CreateDashboardLayoutDto = {
        name: 'New Layout',
        widgets: [
          {
            widgetType: 'stats',
            position: {
              x: 0,
              y: 0,
              width: 4,
              height: 2,
            },
            config: {},
          },
        ],
      };

      createLayoutUseCase.execute.mockResolvedValue(mockLayout);

      const result = await controller.createLayout(mockUser, createDto);

      expect(result).toEqual(mockLayout);
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(mockUser.userId, createDto);
    });

    it('should handle validation errors', async () => {
      const invalidDto: CreateDashboardLayoutDto = {
        name: '',
        widgets: [],
      };
      const error = new Error('Validation failed');
      createLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.createLayout(mockUser, invalidDto)).rejects.toThrow(error);
    });
  });

  describe('updateLayout', () => {
    it('should update an existing layout', async () => {
      const layoutId = 'layout-1';
      const updateDto: UpdateDashboardLayoutDto = {
        name: 'Updated Layout',
        widgets: [
          {
            widgetType: 'charts',
            position: {
              x: 0,
              y: 0,
              width: 6,
              height: 3,
            },
            config: { chartType: 'line' },
          },
        ],
      };

      const updatedLayout = { ...mockLayout, ...updateDto };
      updateLayoutUseCase.execute.mockResolvedValue(updatedLayout);

      const result = await controller.updateLayout(mockUser, layoutId, updateDto);

      expect(result).toEqual(updatedLayout);
      expect(updateLayoutUseCase.execute).toHaveBeenCalledWith(layoutId, mockUser.userId, updateDto);
    });

    it('should handle layout not found during update', async () => {
      const layoutId = 'non-existent';
      const updateDto: UpdateDashboardLayoutDto = { name: 'Updated' };
      const error = new Error('Layout not found');
      updateLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.updateLayout(mockUser, layoutId, updateDto)).rejects.toThrow(error);
    });

    it('should handle permission denied during update', async () => {
      const layoutId = 'layout-1';
      const updateDto: UpdateDashboardLayoutDto = { name: 'Updated' };
      const error = new Error('Permission denied');
      updateLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.updateLayout(mockUser, layoutId, updateDto)).rejects.toThrow(error);
    });
  });

  describe('deleteLayout', () => {
    it('should delete a layout', async () => {
      const layoutId = 'layout-1';
      deleteLayoutUseCase.execute.mockResolvedValue(undefined);

      await controller.deleteLayout(mockUser, layoutId);

      expect(deleteLayoutUseCase.execute).toHaveBeenCalledWith(layoutId, mockUser.userId);
    });

    it('should handle layout not found during delete', async () => {
      const layoutId = 'non-existent';
      const error = new Error('Layout not found');
      deleteLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.deleteLayout(mockUser, layoutId)).rejects.toThrow(error);
    });

    it('should handle permission denied during delete', async () => {
      const layoutId = 'layout-1';
      const error = new Error('Permission denied');
      deleteLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.deleteLayout(mockUser, layoutId)).rejects.toThrow(error);
    });
  });

  describe('setDefaultLayout', () => {
    it('should set a layout as default', async () => {
      const layoutId = 'layout-1';
      setDefaultLayoutUseCase.execute.mockResolvedValue(undefined);

      await controller.setDefaultLayout(mockUser, layoutId);

      expect(setDefaultLayoutUseCase.execute).toHaveBeenCalledWith(layoutId, mockUser.userId);
    });

    it('should handle layout not found when setting default', async () => {
      const layoutId = 'non-existent';
      const error = new Error('Layout not found');
      setDefaultLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.setDefaultLayout(mockUser, layoutId)).rejects.toThrow(error);
    });

    it('should handle permission denied when setting default', async () => {
      const layoutId = 'layout-1';
      const error = new Error('Permission denied');
      setDefaultLayoutUseCase.execute.mockRejectedValue(error);

      await expect(controller.setDefaultLayout(mockUser, layoutId)).rejects.toThrow(error);
    });
  });
});