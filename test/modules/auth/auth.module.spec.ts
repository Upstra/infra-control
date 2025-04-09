import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { AuthService } from '../../../src/modules/auth/application/services/auth.service';


describe('AuthModule', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should provide AuthService', () => {
    expect(service).toBeDefined();
  });
});
