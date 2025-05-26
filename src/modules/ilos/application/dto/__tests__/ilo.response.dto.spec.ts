import { IloResponseDto } from '../ilo.response.dto';

describe('IloResponseDto', () => {
  it('should map Ilo entity fields', () => {
    const iloEntity = { name: 'ilo3', ip: '10.0.0.3' } as any;
    const dto = new IloResponseDto(iloEntity);

    expect(dto.name).toBe('ilo3');
    expect(dto.ip).toBe('10.0.0.3');
  });
});
