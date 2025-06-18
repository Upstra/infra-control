import { SetupProgressMapper } from '../setup-progress.mapper';
import { SetupProgress } from '../../../domain/entities/setup-progress.entity';
import { SetupStep } from '../../dto/setup-status.dto';

describe('SetupProgressMapper', () => {
  it('maps entity to dto', () => {
    const entity: SetupProgress = {
      id: 'id1',
      step: SetupStep.CREATE_ROOM,
      completedAt: new Date('2025-01-01T00:00:00Z'),
      completedBy: 'user',
      metadata: { info: 'data' },
    };

    const dto = SetupProgressMapper.toDto(entity);

    expect(dto).toEqual({
      step: SetupStep.CREATE_ROOM,
      completedAt: '2025-01-01T00:00:00.000Z',
      completedBy: 'user',
      metadata: { info: 'data' },
    });
  });

  it('maps dto to entity', () => {
    const dto = {
      id: 'id2',
      step: SetupStep.CREATE_UPS,
      completedAt: '2025-02-02T12:00:00.000Z',
      completedBy: 'admin',
      metadata: { k: 'v' },
    };

    const entity = SetupProgressMapper.fromDto(dto);

    expect(entity.completedAt).toBeInstanceOf(Date);
    expect(entity.completedAt.toISOString()).toBe(dto.completedAt);
    expect(entity.metadata).toEqual({ k: 'v' });
  });

  it('defaults metadata to empty object on fromDto', () => {
    const dto = {
      id: 'id3',
      step: SetupStep.WELCOME,
      completedAt: '2025-03-03T00:00:00.000Z',
      completedBy: 'u',
    } as any;
    const entity = SetupProgressMapper.fromDto(dto);
    expect(entity.metadata).toEqual({});
  });
});
