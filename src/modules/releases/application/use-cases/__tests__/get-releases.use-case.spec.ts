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

  it('should fetch releases for both repos', async () => {
    gateway.getReleases.mockResolvedValueOnce([createMockRelease({ tagName: 'f' })]);
    gateway.getReleases.mockResolvedValueOnce([createMockRelease({ tagName: 'b' })]);

    const result = await useCase.execute();

    expect(gateway.getReleases).toHaveBeenCalledWith('front');
    expect(gateway.getReleases).toHaveBeenCalledWith('back');
    expect(result.frontend[0].tagName).toBe('f');
    expect(result.backend[0].tagName).toBe('b');
  });
});
