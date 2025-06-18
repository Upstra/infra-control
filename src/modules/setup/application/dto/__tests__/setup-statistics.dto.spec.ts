import { validate } from 'class-validator';
import { SetupStatisticsDto } from '../setup-statistics.dto';

describe('SetupStatisticsDto', () => {
  const buildDto = (
    partial: Partial<SetupStatisticsDto> = {},
  ): SetupStatisticsDto => {
    return Object.assign(new SetupStatisticsDto(), {
      userCount: 1,
      roomCount: 0,
      upsCount: 0,
      serverCount: 0,
      adminCount: 1,
      ...partial,
    });
  };

  it('should validate a valid statistics object', async () => {
    const dto = buildDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail if a count is a string', async () => {
    const dto = buildDto({ userCount: 'one' as any });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userCount');
  });

  it('should fail if a count is negative (even if number)', async () => {
    const dto = buildDto({ adminCount: -1 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
