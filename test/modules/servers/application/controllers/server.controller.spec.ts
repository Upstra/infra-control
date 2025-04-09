import { Test, TestingModule } from '@nestjs/testing';
import { ServerController } from '../../../../src/modules/servers/application/controllers/server.controller';

describe('ServerController', () => {
  let provider: ServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerController],
    }).compile();

    provider = module.get<ServerController>(ServerController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
