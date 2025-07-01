import { GetReleasesUseCase } from '../get-releases.use-case';
import type { GithubGatewayInterface } from '../../../domain/interfaces/github.gateway.interface';
import { createMockRelease } from '../../../__mocks__/release.mock';

describe('GetReleasesUseCase', () => {
  let useCase: GetReleasesUseCase;
  let gateway: jest.Mocked<GithubGatewayInterface>;

  beforeEach(() => {
    gateway = { getReleases: jest.fn() } as any;
    useCase = new GetReleasesUseCase(gateway);
    process.env.FRONT_REPO = 'front';
    process.env.BACK_REPO = 'back';
  });

  it('should paginate releases for both repos', async () => {
    const front = [
      createMockRelease({ tagName: 'f1' }),
      createMockRelease({ tagName: 'f2' }),
    ];
    const back = [createMockRelease({ tagName: 'b1' })];
    gateway.getReleases.mockResolvedValueOnce(front);
    gateway.getReleases.mockResolvedValueOnce(back);

    const result = await useCase.execute(1, 1);

    expect(gateway.getReleases).toHaveBeenCalledWith('front');
    expect(gateway.getReleases).toHaveBeenCalledWith('back');
    expect(result.frontend.items[0].tagName).toBe('f1');
    expect(result.frontend.totalItems).toBe(2);
    expect(result.frontend.currentPage).toBe(1);
    expect(result.backend.items[0].tagName).toBe('b1');
  });
});
