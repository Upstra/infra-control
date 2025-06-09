import { Test, TestingModule } from '@nestjs/testing';
import { GetSetupStatusUseCase } from '../get-setup-status.use-case';

describe('SetupStatusUseCaseService', () => {
  let service: GetSetupStatusUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GetSetupStatusUseCase],
    }).compile();

    service = module.get<GetSetupStatusUseCase>(GetSetupStatusUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
