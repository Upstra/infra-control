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
import { createMockJwtPayload } from '@/modules/auth/__mocks__/jwt-payload.mock';
import {
  CreateDashboardLayoutDto,
  UpdateDashboardLayoutDto,
  DashboardLayoutResponseDto,
  DashboardLayoutListResponseDto,
} from '../../dto/dashboard-layout.dto';

describe('DashboardLayoutController', () => {
  let controller: DashboardLayoutController;
  let createLayoutUseCase: jest.Mocked<CreateLayoutUseCase>;
  let updateLayoutUseCase: jest.Mocked<UpdateLayoutUseCase>;
  let deleteLayoutUseCase: jest.Mocked<DeleteLayoutUseCase>;
  let getLayoutUseCase: jest.Mocked<GetLayoutUseCase>;
  let listLayoutsUseCase: jest.Mocked<ListLayoutsUseCase>;
  let setDefaultLayoutUseCase: jest.Mocked<SetDefaultLayoutUseCase>;

  const mockUser = createMockJwtPayload();

  const mockLayout: DashboardLayoutResponseDto = {
    id: 'layout-1',
    name: 'Test Layout',
    userId: 'test-user-id',
    columns: 12,
    rowHeight: 80,
    isDefault: false,
    widgets: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLayoutList: DashboardLayoutListResponseDto = {
    layouts: [mockLayout],
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

    controller = module.get<DashboardLayoutController>(
      DashboardLayoutController,
    );
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
  });

  describe('getLayout', () => {
    it('should return a specific layout', async () => {
      const layoutId = 'layout-1';
      getLayoutUseCase.execute.mockResolvedValue(mockLayout);

      const result = await controller.getLayout(mockUser, layoutId);

      expect(result).toEqual(mockLayout);
      expect(getLayoutUseCase.execute).toHaveBeenCalledWith(
        layoutId,
        mockUser.userId,
      );
    });
  });

  describe('createLayout', () => {
    it('should create a new layout', async () => {
      const createDto: CreateDashboardLayoutDto = {
        name: 'New Layout',
      };

      createLayoutUseCase.execute.mockResolvedValue(mockLayout);

      const result = await controller.createLayout(mockUser, createDto);

      expect(result).toEqual(mockLayout);
      expect(createLayoutUseCase.execute).toHaveBeenCalledWith(
        mockUser.userId,
        createDto,
      );
    });
  });

  describe('updateLayout', () => {
    it('should update an existing layout', async () => {
      const layoutId = 'layout-1';
      const updateDto: UpdateDashboardLayoutDto = {
        name: 'Updated Layout',
      };

      const updatedLayout = { ...mockLayout, ...updateDto };
      updateLayoutUseCase.execute.mockResolvedValue(updatedLayout);

      const result = await controller.updateLayout(
        mockUser,
        layoutId,
        updateDto,
      );

      expect(result).toEqual(updatedLayout);
      expect(updateLayoutUseCase.execute).toHaveBeenCalledWith(
        layoutId,
        mockUser.userId,
        updateDto,
      );
    });
  });

  describe('deleteLayout', () => {
    it('should delete a layout', async () => {
      const layoutId = 'layout-1';
      deleteLayoutUseCase.execute.mockResolvedValue(undefined);

      await controller.deleteLayout(mockUser, layoutId);

      expect(deleteLayoutUseCase.execute).toHaveBeenCalledWith(
        layoutId,
        mockUser.userId,
      );
    });
  });

  describe('setDefaultLayout', () => {
    it('should set a layout as default', async () => {
      const layoutId = 'layout-1';
      setDefaultLayoutUseCase.execute.mockResolvedValue(undefined);

      await controller.setDefaultLayout(mockUser, layoutId);

      expect(setDefaultLayoutUseCase.execute).toHaveBeenCalledWith(
        layoutId,
        mockUser.userId,
      );
    });
  });
});
