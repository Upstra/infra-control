import { validate } from 'class-validator';
import { SetupProgressDto } from '../setup-prgress.dto';
import { SetupStep } from '../setup-status.dto';

describe('SetupProgressDto', () => {
  const buildDto = (partial: Partial<SetupProgressDto> = {}): SetupProgressDto => {
    return Object.assign(new SetupProgressDto(SetupStep.WELCOME, new Date().toISOString(), 'user-1'), partial);
  };

  it('validates a complete object', async () => {
    const dto = buildDto({ metadata: { note: 'ok' } });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('allows optional fields to be omitted', async () => {
    const dto = buildDto();
    dto.id = undefined;
    dto.completedAt = undefined;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('preserves metadata default when not provided', () => {
    const dto = new SetupProgressDto(SetupStep.CREATE_ROOM, new Date().toISOString(), 'user-2');
    expect(dto.metadata).toEqual({});
  });
});
