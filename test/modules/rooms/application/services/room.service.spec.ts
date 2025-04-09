import { Test, TestingModule } from '@nestjs/testing';
import { RoomService } from '../../../../src/modules/rooms/application/services/room.service';

describe('RoomService', () => {
  let provider: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService],
    }).compile();

    provider = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
