import { Test, TestingModule } from '@nestjs/testing';
import { ReleasesController } from '../releases.controller';
import { GetReleasesUseCase } from '../../use-cases/get-releases.use-case';
import { createMockRelease } from '../../../__mocks__/release.mock';

describe('ReleasesController', () => {
  let controller: ReleasesController;
  let useCase: GetReleasesUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReleasesController],
      providers: [{ provide: GetReleasesUseCase, useValue: { execute: jest.fn() } }],
    }).compile();

    controller = module.get(ReleasesController);
    useCase = module.get(GetReleasesUseCase);
  });

  it('should return changelog', async () => {
    (useCase.execute as jest.Mock).mockResolvedValue({
      frontend: [createMockRelease()],
      backend: [createMockRelease()],
    });

    const result = await controller.getReleases();
    expect(useCase.execute).toHaveBeenCalled();
    expect(result.frontend.length).toBe(1);
  });
});
