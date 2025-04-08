import { Test, TestingModule } from '@nestjs/testing';
import { PermissionServerServiceService } from './permission.server.service.service';

describe('PermissionServerServiceService', () => {
  let service: PermissionServerServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionServerServiceService],
    }).compile();

    service = module.get<PermissionServerServiceService>(
      PermissionServerServiceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
