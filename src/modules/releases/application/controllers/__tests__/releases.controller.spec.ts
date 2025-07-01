import { Test, TestingModule } from '@nestjs/testing';
import { ReleasesController } from '../releases.controller';
import { GetReleasesUseCase } from '../../use-cases/get-releases.use-case';
import { createMockRelease } from '../../../__mocks__/release.mock';
import { ReleaseListResponseDto } from '../../dto/release.list.response.dto';
import { ReleaseResponseDto } from '../../dto/release.response.dto';

describe('ReleasesController', () => {
  let controller: ReleasesController;
  let useCase: GetReleasesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleasesController],
      providers: [
        { provide: GetReleasesUseCase, useValue: { execute: jest.fn() } },
      ],
    }).compile();

    controller = module.get(ReleasesController);
    useCase = module.get(GetReleasesUseCase);
  });

  it('should return changelog', async () => {
    (useCase.execute as jest.Mock).mockResolvedValue({
      frontend: new ReleaseListResponseDto(
        [new ReleaseResponseDto(createMockRelease())],
        1,
        1,
        10,
      ),
      backend: new ReleaseListResponseDto(
        [new ReleaseResponseDto(createMockRelease())],
        1,
        1,
        10,
      ),
    });

    const result = await controller.getReleases('2', '5');
    expect(useCase.execute).toHaveBeenCalledWith(2, 5);
    expect(result.frontend.items.length).toBe(1);
  });

  it('uses defaults', async () => {
    (useCase.execute as jest.Mock).mockResolvedValue({
      frontend: new ReleaseListResponseDto([], 0, 1, 10),
      backend: new ReleaseListResponseDto([], 0, 1, 10),
    });

    await controller.getReleases();
    expect(useCase.execute).toHaveBeenCalledWith(1, 10);
  });
});
