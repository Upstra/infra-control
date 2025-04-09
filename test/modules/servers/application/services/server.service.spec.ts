import { Test, TestingModule } from '@nestjs/testing';
import { ServerService } from '../../../../src/modules/servers/application/services/server.service';

describe('ServerService', () => {
  let provider: ServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerService],
    }).compile();

    provider = module.get<ServerService>(ServerService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
