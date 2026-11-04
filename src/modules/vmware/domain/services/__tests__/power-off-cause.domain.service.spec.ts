import { PowerOffCauseDomainService } from '../power-off-cause.domain.service';
import { createVcenterEvent } from '../../../__mocks__/vmware-telemetry.mock';

describe('PowerOffCauseDomainService', () => {
  const service = new PowerOffCauseDomainService();
  const poweredOff = createVcenterEvent();
  const context = {
    neighbours: [],
    serviceAccounts: ['svc-upstra@vsphere.local'],
    upstraPlanActive: false,
  };

  it('attributes the power off to HA when a neighbour HA event exists', () => {
    const ha = createVcenterEvent({
      key: 884214,
      type: 'com.vmware.vc.ha.VmRestartedByHAEvent',
      createdAt: '2026-11-04T20:05:16.000Z',
    });

    expect(
      service.determine(poweredOff, {
        ...context,
        neighbours: [poweredOff, ha],
      }),
    ).toEqual({
      at: poweredOff.createdAt,
      cause: 'ha',
      by: null,
    });
  });

  it('attributes the power off to Upstra for its service account or a running plan', () => {
    const bySvc = createVcenterEvent({ userName: 'VSPHERE.LOCAL\\svc-upstra' });

    expect(service.determine(bySvc, context).cause).toBe('upstra');
    expect(
      service.determine(poweredOff, { ...context, upstraPlanActive: true })
        .cause,
    ).toBe('upstra');
  });

  it('falls back to manual with the user name', () => {
    const farHa = createVcenterEvent({
      key: 2,
      type: 'com.vmware.vc.ha.VmRestartedByHAEvent',
      createdAt: '2026-11-04T20:06:00.000Z',
    });

    expect(
      service.determine(poweredOff, { ...context, neighbours: [farHa] }),
    ).toEqual({
      at: poweredOff.createdAt,
      cause: 'manual',
      by: 'VSPHERE.LOCAL\\jbidule',
    });
  });
});
