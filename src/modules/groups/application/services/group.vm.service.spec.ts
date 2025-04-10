import { Test, TestingModule } from '@nestjs/testing';
import { GroupVmService } from './group.vm.service';

describe('GroupVmService', () => {
  let service: GroupVmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupVmService],
    }).compile();

    service = module.get<GroupVmService>(GroupVmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
