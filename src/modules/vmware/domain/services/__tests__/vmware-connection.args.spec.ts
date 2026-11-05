import { VmwareConnectionService } from '../vmware-connection.service';

describe('VmwareConnectionService', () => {
  const service = new VmwareConnectionService();

  it('builds the connection arguments and only adds a non default port', () => {
    expect(
      service.buildConnectionArgs({
        host: 'vc',
        user: 'svc',
        password: 'p',
        port: 443,
      }),
    ).toEqual(['--ip', 'vc', '--user', 'svc', '--password', 'p']);
    expect(
      service.buildConnectionArgs({
        host: 'vc',
        user: 'svc',
        password: 'p',
        port: 8989,
      }),
    ).toContain('8989');
  });

  it('recognises VMware servers and validates connections', () => {
    expect(service.isVmwareServer({ type: 'vcenter' } as any)).toBe(true);
    expect(service.isVmwareServer({ type: 'physical' } as any)).toBe(false);
    expect(
      service.validateConnection({
        host: 'vc',
        user: 'svc',
        password: '',
        port: 443,
      }),
    ).toBe(false);
    expect(
      service.buildVmwareConnection({
        ip: 'vc',
        login: 'svc',
        password: 'p',
      } as any),
    ).toEqual({
      host: 'vc',
      user: 'svc',
      password: 'p',
      port: 443,
    });
  });
});
