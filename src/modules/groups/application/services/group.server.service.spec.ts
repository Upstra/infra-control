import { Test, TestingModule } from '@nestjs/testing';
import { GroupServerService } from './group.server.service';

describe('GroupServerService', () => {
  let service: GroupServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupServerService],
    }).compile();

    service = module.get<GroupServerService>(GroupServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
