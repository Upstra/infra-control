import { Ilo } from '../domain/entities/ilo.entity';
import { IloCreationDto } from '../application/dto/ilo.creation.dto';
import { IloResponseDto } from '../application/dto/ilo.response.dto';

export const createMockIlo = (overrides: Partial<Ilo> = {}): Ilo => {
  return Object.assign(new Ilo(), {
    name: 'ilo',
    ip: '10.0.0.1',
    login: 'root',
    password: 'pwd',
    ...overrides,
  });
};

export const createMockIloCreationDto = (
  overrides: Partial<IloCreationDto> = {},
): IloCreationDto => ({
  name: 'ilo',
  ip: '10.0.0.1',
  login: 'root',
  password: 'pwd',
  ...overrides,
});

export const createMockIloResponseDto = (
  overrides: Partial<IloResponseDto> = {},
): IloResponseDto => {
  const ilo = createMockIlo();
  return Object.assign(new IloResponseDto(ilo), overrides);
};
