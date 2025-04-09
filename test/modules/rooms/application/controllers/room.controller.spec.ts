import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from '../../../../src/modules/rooms/application/controllers/room.controller';

describe('RoomController', () => {
  let provider: RoomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomController],
    }).compile();

    provider = module.get<RoomController>(RoomController);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
