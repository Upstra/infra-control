import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerService } from './permission.server.service';

describe('PermissionServerService', () => {
  let service: PermissionServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServerService],
    }).compile();

    service = module.get<PermissionServerService>(PermissionServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
