import { normalizeServerState } from '../bulk-create.use-case';

describe('normalizeServerState', () => {
  it('keeps the canonical values', () => {
    expect(normalizeServerState('UP')).toBe('UP');
    expect(normalizeServerState('DOWN')).toBe('DOWN');
  });

  it('maps the legacy wizard values the rest of the app does not read', () => {
    expect(normalizeServerState('active')).toBe('UP');
    expect(normalizeServerState('inactive')).toBe('DOWN');
    expect(normalizeServerState(' Stopped ')).toBe('DOWN');
    expect(normalizeServerState('poweredOff')).toBe('DOWN');
  });

  it('defaults to UP when the state is omitted', () => {
    expect(normalizeServerState(undefined)).toBe('UP');
    expect(normalizeServerState(null)).toBe('UP');
    expect(normalizeServerState('')).toBe('UP');
  });
});
