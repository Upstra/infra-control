import { UpsResponseDto } from '../ups.response.dto';
import { createMockUps } from '@/modules/ups/__mocks__/ups.mock';

describe('UpsResponseDto', () => {
  it('should map a valid Ups entity', () => {
    const ups = createMockUps({
      id: 'ups-123',
      name: 'Onduleur test',
      ip: '10.0.0.9',
      grace_period_on: 10,
      grace_period_off: 5,
      roomId: 'room-123',
    });

    const dto = new UpsResponseDto(ups);

    expect(dto.id).toBe('ups-123');
    expect(dto.name).toBe('Onduleur test');
    expect(dto.ip).toBe('10.0.0.9');
    expect(dto.roomId).toBe('room-123');
  });
});
