import { countChanges } from '../release-stats';

describe('countChanges', () => {
  it('counts release-please style sections', () => {
    const body = [
      '## [1.4.0](https://example.com) (2026-11-01)',
      '',
      '### Features',
      '',
      '* **pulse:** server rows ([abc](https://x))',
      '* ups cards',
      '',
      '### Bug Fixes',
      '',
      '* setup skipped after a reset',
    ].join('\n');
    expect(countChanges(body)).toEqual({ features: 2, fixes: 1 });
  });

  it('counts flat conventional commit lists', () => {
    const body = [
      "## What's Changed",
      '- feat(setup): auto ping imported resources',
      '- **fix:** parseInt on a UUID',
      '- fix!: breaking fix',
      '- chore: bump deps',
      '- docs: readme',
    ].join('\n');
    expect(countChanges(body)).toEqual({ features: 1, fixes: 2 });
  });

  it('does not read "Bug Fixes" as a feature heading', () => {
    expect(countChanges('### Bug Fixes\n- a\n- b')).toEqual({
      features: 0,
      fixes: 2,
    });
  });

  it('ignores bullets outside known sections and empty bodies', () => {
    expect(countChanges('### Maintenance\n- a\n- b')).toEqual({
      features: 0,
      fixes: 0,
    });
    expect(countChanges('')).toEqual({ features: 0, fixes: 0 });
  });
});
