import { Test, TestingModule } from '@nestjs/testing';
import { RoomModule } from '../../../../src/modules/rooms/room.module';

describe('RoomModule', () => {
  let provider: RoomModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomModule],
    }).compile();

    provider = module.get<RoomModule>(RoomModule);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
