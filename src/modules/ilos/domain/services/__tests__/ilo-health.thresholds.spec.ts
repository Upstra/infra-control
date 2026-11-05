import { IloHealthDomainService } from '../ilo-health.domain.service';
import { createIloHealth } from '../../../__mocks__/ilo-health.mock';

describe('IloHealthDomainService thresholds', () => {
  const service = new IloHealthDomainService();

  it('completes partial room or Redfish thresholds', () => {
    expect(
      service.inletThresholds(createIloHealth(), { inletCritC: 33 }),
    ).toEqual({ warnC: 33, critC: 33, source: 'room' });
    expect(
      service.inletThresholds(
        createIloHealth({ inletWarnC: null, inletCritC: 40 }),
      ),
    ).toEqual({ warnC: 40, critC: 40, source: 'redfish' });
    expect(
      service.inletThresholds(
        createIloHealth({ inletWarnC: 38, inletCritC: null }),
      ),
    ).toEqual({ warnC: 38, critC: 35, source: 'redfish' });
  });

  it('treats a missing inlet as normal and back to normal', () => {
    const health = createIloHealth({ inletC: null });

    expect(service.inletLevel(health)).toBe('normal');
    expect(service.inletBackToNormal(health)).toBe(true);
    expect(service.inletLevel(createIloHealth({ inletC: 47 }))).toBe(
      'critical',
    );
  });

  it('flags a present but failing PSU', () => {
    const health = createIloHealth({
      supplies: [
        {
          name: 'PSU 1',
          state: 'Enabled',
          health: 'OK',
          capacityW: 800,
          outputW: 400,
        },
        {
          name: 'PSU 2',
          state: 'Enabled',
          health: 'Critical',
          capacityW: 800,
          outputW: 0,
        },
      ],
    });

    expect(service.psuDegraded(health)).toBe(true);
  });
});
