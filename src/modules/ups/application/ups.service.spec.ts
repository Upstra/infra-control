import { Test, TestingModule } from '@nestjs/testing';
import { UpsService } from './ups.service';

describe('UpsService', () => {
  let service: UpsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsService],
    }).compile();

    service = module.get<UpsService>(UpsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
