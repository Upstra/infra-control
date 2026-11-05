import axios from 'axios';
import { PrometheusHttpClient } from '../prometheus-http.client';

jest.mock('axios');

describe('PrometheusHttpClient', () => {
  const get = axios.get as jest.Mock;

  beforeEach(() => get.mockReset());

  it('queries the range API of the configured Prometheus with a 5 s timeout', async () => {
    get.mockResolvedValue({
      data: {
        status: 'success',
        data: { result: [{ metric: {}, values: [[1, '2']] }] },
      },
    });
    const client = new PrometheusHttpClient({
      get: () => 'http://prom:9090',
    } as any);

    const result = await client.queryRange('sum(x)', 10, 20, 15);

    expect(get).toHaveBeenCalledWith('http://prom:9090/api/v1/query_range', {
      params: { query: 'sum(x)', start: 10, end: 20, step: 15 },
      timeout: 5000,
    });
    expect(result).toEqual([{ metric: {}, values: [[1, '2']] }]);
  });

  it('defaults to http://prometheus:9090 and surfaces Prometheus errors', async () => {
    get
      .mockResolvedValueOnce({
        data: { status: 'error', error: 'parse error' },
      })
      .mockResolvedValueOnce({ data: { status: 'success', data: {} } });
    const client = new PrometheusHttpClient({ get: () => undefined } as any);

    await expect(client.queryRange('q', 1, 2, 3)).rejects.toThrow(
      'parse error',
    );
    await expect(client.queryRange('q', 1, 2, 3)).resolves.toEqual([]);
    expect(get.mock.calls[0][0]).toBe(
      'http://prometheus:9090/api/v1/query_range',
    );
  });
});
