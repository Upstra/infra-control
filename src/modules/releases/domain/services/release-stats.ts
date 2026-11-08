import type { Release } from '../interfaces/release.interface';

export interface ReleaseStats {
  releases: number;
  features: number;
  fixes: number;
}

type Kind = 'feature' | 'fix' | null;

const FEATURE_HEADING = /(feat|feature|fonctionnalit|nouveaut|added|new)/i;
const FIX_HEADING = /(fix|bug|correct)/i;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
// Conventional commit lines, optionally bold or with a scope: "**feat(ui):**".
const FEATURE_ITEM = /^(\*\*)?feat(ure)?(\([^)]*\))?!?:/i;
const FIX_ITEM = /^(\*\*)?(fix|bugfix|hotfix)(\([^)]*\))?!?:/i;

const headingKind = (title: string): Kind => {
  // "Bug Fixes" must not be read as a feature heading because of "Fixes".
  if (FIX_HEADING.test(title)) return 'fix';
  if (FEATURE_HEADING.test(title)) return 'feature';
  return null;
};

/**
 * Counts the user-facing changes listed in GitHub release notes. Handles both
 * release-please / conventional-changelog sections ("### Features",
 * "### Bug Fixes") and flat lists of conventional commit lines ("- fix: …").
 */
export const countChanges = (body: string): Omit<ReleaseStats, 'releases'> => {
  let section: Kind = null;
  let features = 0;
  let fixes = 0;

  for (const line of (body ?? '').split(/\r?\n/)) {
    const heading = line.match(HEADING);
    if (heading) {
      section = headingKind(heading[1]);
      continue;
    }
    const bullet = line.match(BULLET);
    if (!bullet) continue;
    const item = bullet[1].trim();
    const kind: Kind = FEATURE_ITEM.test(item)
      ? 'feature'
      : FIX_ITEM.test(item)
        ? 'fix'
        : section;
    if (kind === 'feature') features++;
    else if (kind === 'fix') fixes++;
  }

  return { features, fixes };
};

export const releaseStats = (releases: Release[]): ReleaseStats =>
  releases.reduce<ReleaseStats>(
    (stats, release) => {
      const { features, fixes } = countChanges(release.body);
      return {
        releases: stats.releases + 1,
        features: stats.features + features,
        fixes: stats.fixes + fixes,
      };
    },
    { releases: 0, features: 0, fixes: 0 },
  );
