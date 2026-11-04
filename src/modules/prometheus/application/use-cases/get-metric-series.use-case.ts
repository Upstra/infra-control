import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisSafeService } from '@/modules/redis/application/services/redis-safe.service';
import {
  buildPromQuery,
  isValidScopeId,
  METRIC_CATALOG,
  MetricRange,
  MetricScope,
  RANGE_SETTINGS,
} from '../../domain/metric-catalog';
import { PrometheusHttpClient } from '../../infrastructure/prometheus-http.client';
import {
  MetricSeriesQueryDto,
  MetricSeriesResponseDto,
} from '../dto/metric-series.dto';

const CACHE_TTL_SECONDS = 15;

@Injectable()
export class GetMetricSeriesUseCase {
  constructor(
    private readonly prometheus: PrometheusHttpClient,
    private readonly redis: RedisSafeService,
  ) {}

  async execute(query: MetricSeriesQueryDto): Promise<MetricSeriesResponseDto> {
    const definition = METRIC_CATALOG[query.metric];
    const range = RANGE_SETTINGS[query.range as MetricRange];
    const scope = query.scope as MetricScope;
    if (!definition || !range || !definition.scopes.includes(scope)) {
      throw new BadRequestException('Unsupported metric, scope or range');
    }
    if (!isValidScopeId(scope, query.id)) {
      throw new BadRequestException(`Invalid id for scope ${scope}`);
    }

    const cacheKey = `metrics:series:${query.metric}:${scope}:${query.id ?? '-'}:${query.range}`;
    const cached = await this.redis.safeGet(cacheKey);
    if (cached) return JSON.parse(cached) as MetricSeriesResponseDto;

    const end = Math.floor(Date.now() / 1000);
    let result;
    try {
      result = await this.prometheus.queryRange(
        buildPromQuery(definition, scope, query.id),
        end - range.seconds,
        end,
        range.step,
      );
    } catch (error) {
      throw new ServiceUnavailableException({
        code: 'HISTORY_UNAVAILABLE',
        message: `Prometheus unavailable: ${error?.message ?? 'unknown error'}`,
      });
    }

    const response: MetricSeriesResponseDto = {
      metric: query.metric,
      unit: definition.unit,
      range: query.range,
      step: range.step,
      series: result.map((series) => ({
        label:
          scope === 'total'
            ? 'total'
            : (definition.seriesLabel &&
                series.metric[definition.seriesLabel]) ||
              query.id!,
        points: series.values.map(([timestamp, value]): [number, number] => [
          Math.round(timestamp * 1000),
          Number(value),
        ]),
      })),
    };
    await this.redis.safeSetEx(
      cacheKey,
      CACHE_TTL_SECONDS,
      JSON.stringify(response),
    );
    return response;
  }
}
