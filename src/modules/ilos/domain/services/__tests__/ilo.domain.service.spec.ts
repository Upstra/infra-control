import { IloCreationDto } from '@/modules/ilos/application/dto/ilo.creation.dto';
import { IloDomainService } from '../ilo.domain.service';
import { IloUpdateDto } from '@/modules/ilos/application/dto/ilo.update.dto';
import { Ilo } from '../../entities/ilo.entity';

describe('IloDomainService', () => {
  const service = new IloDomainService();

  describe('createIloEntityFromDto', () => {
    it('should map creation dto to Ilo entity', () => {
      const dto: IloCreationDto = {
        name: 'iloName',
        ip: '10.0.0.1',
        login: 'admin',
        password: 'secret',
      };

      const ilo = service.createIloEntityFromDto(dto);

      expect(ilo).toBeInstanceOf(Ilo);
      expect(ilo.name).toBe(dto.name);
      expect(ilo.ip).toBe(dto.ip);
      expect(ilo.login).toBe(dto.login);
      expect(ilo.password).toBe(dto.password);
    });
  });

  describe('updateIloEntityFromDto', () => {
    it('should update only provided fields', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {
        name: 'newName',
        ip: undefined,
        login: 'newLogin',
        password: undefined,
      };

      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.name).toBe('newName');
      expect(result.ip).toBe('oldIp');
      expect(result.login).toBe('newLogin');
      expect(result.password).toBe('oldPassword');
    });

    it('should update password when explicitly set to a new value', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {
        password: 'newPassword',
      };

      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.name).toBe('oldName');
      expect(result.ip).toBe('oldIp');
      expect(result.login).toBe('oldLogin');
      expect(result.password).toBe('newPassword');
    });

    it('should update password when explicitly set to null', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {
        password: null,
      };

      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.password).toBeNull();
    });

    it('should update all fields when all are provided', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {
        name: 'newName',
        ip: 'newIp',
        login: 'newLogin',
        password: 'newPassword',
      };

      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.name).toBe('newName');
      expect(result.ip).toBe('newIp');
      expect(result.login).toBe('newLogin');
      expect(result.password).toBe('newPassword');
    });

    it('should handle null values for non-password fields using nullish coalescing', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {
        name: null,
        ip: null,
        login: null,
      };

      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.name).toBe('oldName');
      expect(result.ip).toBe('oldIp');
      expect(result.login).toBe('oldLogin');
      expect(result.password).toBe('oldPassword');
    });

    it('should not update any field if dto is empty', () => {
      const ilo = new Ilo();
      ilo.name = 'oldName';
      ilo.ip = 'oldIp';
      ilo.login = 'oldLogin';
      ilo.password = 'oldPassword';

      const dto: IloUpdateDto = {};
      const result = service.updateIloEntityFromDto(ilo, dto);

      expect(result).toBe(ilo);
      expect(result.name).toBe('oldName');
      expect(result.ip).toBe('oldIp');
      expect(result.login).toBe('oldLogin');
      expect(result.password).toBe('oldPassword');
    });
  });
});
