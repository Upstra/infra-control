import { Test, TestingModule } from '@nestjs/testing';
import { ServerDomainService } from '../../../../src/modules/servers/domain/services/server.domain.service';

describe('ServerDomainService', () => {
  let provider: ServerDomainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServerDomainService],
    }).compile();

    provider = module.get<ServerDomainService>(ServerDomainService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
