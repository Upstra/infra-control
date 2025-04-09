import { Test, TestingModule } from '@nestjs/testing';
import { ServerModule } from '../../../../src/modules/servers/server.module';

describe('ServerModule', () => {
  let provider: ServerModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerModule],
    }).compile();

    provider = module.get<ServerModule>(ServerModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
