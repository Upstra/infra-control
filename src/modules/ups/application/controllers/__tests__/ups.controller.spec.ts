import { Test, TestingModule } from '@nestjs/testing';
import { UpsController } from '../ups.controller';
import { CreateUpsUseCase } from '@/modules/ups/application/use-cases/create-ups.use-case';
import { DeleteUpsUseCase } from '@/modules/ups/application/use-cases/delete-ups.use-case';
import { GetAllUpsUseCase } from '@/modules/ups/application/use-cases/get-all-ups.use-case';
import { GetUpsListUseCase } from '@/modules/ups/application/use-cases/get-ups-list.use-case';
import { GetUpsByIdUseCase } from '@/modules/ups/application/use-cases/get-ups-by-id.use-case';
import { UpdateUpsUseCase } from '@/modules/ups/application/use-cases/update-ups.use-case';
import {
  createMockUps,
  createMockUpsDto,
} from '@/modules/ups/__mocks__/ups.mock';
import { UpsResponseDto } from '../../dto/ups.response.dto';

describe('UpsController', () => {
  let controller: UpsController;
  let getAllUseCase: jest.Mocked<GetAllUpsUseCase>;
  let getListUseCase: jest.Mocked<GetUpsListUseCase>;
  let getByIdUseCase: jest.Mocked<GetUpsByIdUseCase>;
  let createUseCase: jest.Mocked<CreateUpsUseCase>;
  let updateUseCase: jest.Mocked<UpdateUpsUseCase>;
  let deleteUseCase: jest.Mocked<DeleteUpsUseCase>;

  beforeEach(async () => {
    getAllUseCase = { execute: jest.fn() } as any;
    getListUseCase = { execute: jest.fn() } as any;
    getByIdUseCase = { execute: jest.fn() } as any;
    createUseCase = { execute: jest.fn() } as any;
    updateUseCase = { execute: jest.fn() } as any;
    deleteUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpsController],
      providers: [
        { provide: GetAllUpsUseCase, useValue: getAllUseCase },
        { provide: GetUpsListUseCase, useValue: getListUseCase },
        { provide: GetUpsByIdUseCase, useValue: getByIdUseCase },
        { provide: CreateUpsUseCase, useValue: createUseCase },
        { provide: UpdateUpsUseCase, useValue: updateUseCase },
        { provide: DeleteUpsUseCase, useValue: deleteUseCase },
      ],
    }).compile();

    controller = module.get<UpsController>(UpsController);
  });

  it('should return paginated UPS list', async () => {
    const mock = { items: [new UpsResponseDto(createMockUps())] } as any;
    getListUseCase.execute.mockResolvedValue(mock);
    const result = await controller.getUps('1', '5');
    expect(result).toBe(mock);
    expect(getListUseCase.execute).toHaveBeenCalledWith(1, 5);
  });

  it('should return all UPSs', async () => {
    const mock = [new UpsResponseDto(createMockUps())];
    getAllUseCase.execute.mockResolvedValue(mock);
    const result = await controller.getAllUps();
    expect(result).toEqual(mock);
    expect(getAllUseCase.execute).toHaveBeenCalled();
  });

  it('should return a UPS by ID', async () => {
    const mock = new UpsResponseDto(createMockUps());
    getByIdUseCase.execute.mockResolvedValue(mock);
    const result = await controller.getUpsById('ups-123');
    expect(result).toEqual(mock);
    expect(getByIdUseCase.execute).toHaveBeenCalledWith('ups-123');
  });

  it('should create a new UPS', async () => {
    const dto = createMockUpsDto();
    const mock = new UpsResponseDto({ ...dto, id: 'ups-123' } as any);
    createUseCase.execute.mockResolvedValue(mock);
    const result = await controller.createUps(dto);
    expect(result).toEqual(mock);
    expect(createUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('should update a UPS', async () => {
    const dto = { name: 'Updated UPS' };
    const mock = new UpsResponseDto(createMockUps({ name: 'Updated UPS' }));
    updateUseCase.execute.mockResolvedValue(mock);
    const result = await controller.updateUps('ups-123', dto);
    expect(result).toEqual(mock);
    expect(updateUseCase.execute).toHaveBeenCalledWith('ups-123', dto);
  });

  it('should delete a UPS', async () => {
    deleteUseCase.execute.mockResolvedValue();
    await controller.deleteUps('ups-123');
    expect(deleteUseCase.execute).toHaveBeenCalledWith('ups-123');
  });
});
