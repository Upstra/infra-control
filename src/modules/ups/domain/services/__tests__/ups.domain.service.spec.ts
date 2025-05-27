import { UpsDomainService } from '../ups.domain.service';
import { UpsCreationDto } from '@/modules/ups/application/dto/ups.creation.dto';
import { UpsUpdateDto } from '@/modules/ups/application/dto/ups.update.dto';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';
import * as bcrypt from 'bcryptjs';

describe('UpsDomainService', () => {
  let service: UpsDomainService;

  beforeEach(() => {
    service = new UpsDomainService();
  });

  describe('createUpsEntityFromCreateDto', () => {
    it('should return a valid Ups entity with hashed password', async () => {
      const dto: UpsCreationDto = {
        name: 'UPS-1',
        ip: '192.168.1.1',
        login: 'admin',
        password: 'adminpass',
        grace_period_on: 10,
        grace_period_off: 5,
        roomId: 'room-uuid',
      };

      const result = await service.createUpsEntityFromCreateDto(dto);

      expect(result).toBeInstanceOf(Ups);
      expect(result.name).toBe(dto.name);
      expect(result.ip).toBe(dto.ip);
      expect(result.login).toBe(dto.login);
      expect(result.roomId).toBe(dto.roomId);
      expect(result.grace_period_on).toBe(dto.grace_period_on);
      expect(result.grace_period_off).toBe(dto.grace_period_off);
      expect(await bcrypt.compare(dto.password, result.password)).toBe(true);
    });
  });

  describe('createUpsEntityFromUpdateDto', () => {
    it('should update only provided fields and hash password if present', async () => {
      const existing = new Ups();
      existing.name = 'OldName';
      existing.ip = 'old-ip';
      existing.login = 'old-login';
      existing.password = await bcrypt.hash('oldpass', 10);
      existing.grace_period_on = 5;
      existing.grace_period_off = 3;
      existing.roomId = 'old-room';

      const dto: UpsUpdateDto = {
        name: 'NewName',
        password: 'newpass',
        grace_period_on: 15,
      };

      const result = await service.createUpsEntityFromUpdateDto(existing, dto);

      expect(result.name).toBe('NewName');
      expect(result.ip).toBe('old-ip');
      expect(result.login).toBe('old-login');
      expect(result.grace_period_on).toBe(15);
      expect(result.grace_period_off).toBe(3);
      expect(result.roomId).toBe('old-room');
      expect(await bcrypt.compare('newpass', result.password)).toBe(true);
    });

    it('should retain all values if dto is empty', async () => {
      const existing = new Ups();
      existing.name = 'UPS';
      existing.ip = '192.168.1.100';
      existing.login = 'admin';
      existing.password = await bcrypt.hash('secure', 10);
      existing.grace_period_on = 20;
      existing.grace_period_off = 10;
      existing.roomId = 'room-1';

      const result = await service.createUpsEntityFromUpdateDto(existing, {});

      expect(result.name).toBe(existing.name);
      expect(result.ip).toBe(existing.ip);
      expect(result.login).toBe(existing.login);
      expect(result.grace_period_on).toBe(existing.grace_period_on);
      expect(result.grace_period_off).toBe(existing.grace_period_off);
      expect(result.roomId).toBe(existing.roomId);
      expect(result.password).toBe(existing.password);
    });
  });
});
