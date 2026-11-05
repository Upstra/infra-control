import { PythonExecutorService } from '../python-executor.service';

describe('PythonExecutorService arguments', () => {
  const service = new PythonExecutorService({ get: () => undefined } as any);

  it('keeps a trailing secret flag without value and is case insensitive', () => {
    expect(
      service.prepareArguments(['--ip', 'h', '--PASSWORD', 'x', '--password']),
    ).toEqual({
      args: ['--ip', 'h', '--password'],
      env: { UPSTRA_PASSWORD: 'x' },
    });
  });

  it('leaves scripts without secrets untouched', () => {
    expect(service.prepareArguments(['--format', 'json'])).toEqual({
      args: ['--format', 'json'],
      env: {},
    });
    expect(service.prepareArguments([])).toEqual({ args: [], env: {} });
  });
});
