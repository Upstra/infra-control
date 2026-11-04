import { IloHealthDomainService } from '../ilo-health.domain.service';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('IloHealthDomainService', () => {
  const service = new IloHealthDomainService();

  it('prefers room thresholds over Redfish ones, then falls back to 30/35', () => {
    const health = createIloHealth({ inletC: 31 });

    expect(service.inletLevel(health)).toBe('normal');
    expect(service.inletLevel(health, { inletWarnC: 28, inletCritC: 33 })).toBe(
      'warning',
    );
    expect(
      service.inletThresholds(
        createIloHealth({ inletWarnC: null, inletCritC: null }),
      ),
    ).toEqual({
      warnC: 30,
      critC: 35,
      source: 'default',
    });
  });

  it('flags a lost redundancy when one of two PSUs is absent', () => {
    const health = createIloHealth({
      supplies: [
        {
          name: 'PSU 1',
          state: 'Enabled',
          health: 'OK',
          capacityW: 800,
          outputW: 412,
        },
        {
          name: 'PSU 2',
          state: 'Absent',
          health: null,
          capacityW: null,
          outputW: null,
        },
      ],
    });

    expect(service.psuDegraded(health)).toBe(true);
    expect(service.summarize(health).psu).toEqual({ ok: 1, total: 2 });
  });

  it('does not flag a server that only declares one PSU', () => {
    const health = createIloHealth({
      supplies: [
        {
          name: 'PSU 1',
          state: 'Enabled',
          health: 'OK',
          capacityW: 800,
          outputW: 412,
        },
      ],
    });

    expect(service.psuDegraded(health)).toBe(false);
  });
});
