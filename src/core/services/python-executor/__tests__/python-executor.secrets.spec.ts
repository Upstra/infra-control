import { PythonExecutorService } from '../python-executor.service';

describe('PythonExecutorService secrets and TLS', () => {
  const config = (values: Record<string, string> = {}) =>
    ({ get: (key: string) => values[key] }) as any;

  it('moves passwords and SNMP communities out of the command line into the environment', () => {
    const service = new PythonExecutorService(config());

    const prepared = service.prepareArguments([
      '--ip',
      'vc.lan',
      '--user',
      'svc',
      '--password',
      's3cret',
      '--community',
      'private',
    ]);

    expect(prepared.args).toEqual(['--ip', 'vc.lan', '--user', 'svc']);
    expect(prepared.env).toEqual({
      UPSTRA_PASSWORD: 's3cret',
      UPSTRA_SNMP_COMMUNITY: 'private',
    });
  });

  it('forwards the TLS verification settings to the scripts', () => {
    expect(new PythonExecutorService(config()).tlsEnvironment()).toEqual({
      UPSTRA_VERIFY_SSL: 'false',
    });
    expect(
      new PythonExecutorService(
        config({
          PYTHON_VERIFY_SSL: 'true',
          PYTHON_CA_BUNDLE: '/etc/upstra/ca.pem',
        }),
      ).tlsEnvironment(),
    ).toEqual({
      UPSTRA_VERIFY_SSL: 'true',
      UPSTRA_CA_BUNDLE: '/etc/upstra/ca.pem',
    });
  });
});
