import { PresenceDomainService } from '../presence.domain.service';

describe('PresenceDomainService', () => {
  const service = new PresenceDomainService();

  it('sanitises the route and title sent by the browser', () => {
    expect(service.sanitizeRoute('/ups')).toBe('/ups');
    expect(service.sanitizeRoute('javascript:alert(1)')).toBeNull();
    expect(service.sanitizeRoute(42)).toBeNull();
    expect(service.sanitizeRoute(undefined)).toBeUndefined();
    expect(service.sanitizeTitle('x'.repeat(300))).toHaveLength(255);
    expect(service.sanitizeTitle(12)).toBeNull();
    expect(service.sanitizeTitle(undefined)).toBeUndefined();
  });

  it('reports offline users and idle users without a known activity', () => {
    expect(service.toView('u', null, true)).toEqual({
      userId: 'u',
      online: false,
      status: null,
      route: null,
      title: null,
      lastActivityAt: null,
    });
    expect(
      service.status({
        route: null,
        title: null,
        lastActivityAt: null,
        connectedAt: null,
      }),
    ).toBe('idle');
  });

  it('only lets active authenticated viewers see activity', () => {
    expect(service.canSeeActivity({ userId: 'u' })).toBe(true);
    expect(service.canSeeActivity({ userId: 'u', isActive: false })).toBe(
      false,
    );
    expect(service.canSeeActivity(null)).toBe(false);
  });
});
