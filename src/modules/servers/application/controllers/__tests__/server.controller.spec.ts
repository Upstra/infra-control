import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../server.controller';
import {
  CreateServerUseCase,
  DeleteServerUseCase,
  GetAllServersUseCase,
  GetServerByIdUseCase,
  UpdateServerUseCase,
} from '@/modules/servers/application/use-cases';
import { createMockServerDto } from '@/modules/servers/__mocks__/servers.mock';

describe('ServerController', () => {
  let controller: ServerController;
  let getAllServersUseCase: jest.Mocked<GetAllServersUseCase>;
  let getServerByIdUseCase: jest.Mocked<GetServerByIdUseCase>;
  let createServerUseCase: jest.Mocked<CreateServerUseCase>;
  let updateServerUseCase: jest.Mocked<UpdateServerUseCase>;
  let deleteServerUseCase: jest.Mocked<DeleteServerUseCase>;

  beforeEach(async () => {
    getAllServersUseCase = { execute: jest.fn() } as any;
    getServerByIdUseCase = { execute: jest.fn() } as any;
    createServerUseCase = { execute: jest.fn() } as any;
    updateServerUseCase = { execute: jest.fn() } as any;
    deleteServerUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServerController],
      providers: [
        { provide: GetAllServersUseCase, useValue: getAllServersUseCase },
        { provide: GetServerByIdUseCase, useValue: getServerByIdUseCase },
        { provide: CreateServerUseCase, useValue: createServerUseCase },
        { provide: UpdateServerUseCase, useValue: updateServerUseCase },
        { provide: DeleteServerUseCase, useValue: deleteServerUseCase },
      ],
    }).compile();

    controller = module.get(ServerController);
  });

  it('should return all servers', async () => {
    const dto = createMockServerDto();
    getAllServersUseCase.execute.mockResolvedValue([dto]);

    const result = await controller.getAllServers();
    expect(result).toEqual([dto]);
  });

  it('should return a server by id', async () => {
    const dto = createMockServerDto();
    getServerByIdUseCase.execute.mockResolvedValue(dto);

    const result = await controller.getServerById('server-uuid');
    expect(result).toEqual(dto);
  });

  it('should create a server', async () => {
    const dto = createMockServerDto();
    createServerUseCase.execute.mockResolvedValue(dto);

    const result = await controller.createServer({
      ...dto,
      ilo: undefined,
    } as any);
    expect(result).toEqual(dto);
  });

  it('should update a server', async () => {
    const dto = createMockServerDto();
    updateServerUseCase.execute.mockResolvedValue(dto);

    const result = await controller.updateServer('server-uuid', {
      name: 'Updated',
    });
    expect(result).toEqual(dto);
  });

  it('should delete a server', async () => {
    deleteServerUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.deleteServer('server-uuid');
    expect(result).toBeUndefined();
  });
});
