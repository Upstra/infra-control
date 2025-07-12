import { UpsDomainService } from '../ups.domain.service';
import { UpsCreationDto } from '@/modules/ups/application/dto/ups.creation.dto';
import { UpsUpdateDto } from '@/modules/ups/application/dto/ups.update.dto';
import { Ups } from '@/modules/ups/domain/entities/ups.entity';

describe('UpsDomainService', () => {
  let service: UpsDomainService;

  beforeEach(() => {
    service = new UpsDomainService();
  });

  describe('createUpsEntityFromCreateDto', () => {
    it('should return a valid Ups entity', async () => {
      const dto: UpsCreationDto = {
        name: 'UPS-1',
        ip: '192.168.1.1',
        roomId: 'room-uuid',
      };

      const result = await service.createUpsEntityFromCreateDto(dto);

      expect(result).toBeInstanceOf(Ups);
      expect(result.name).toBe(dto.name);
      expect(result.ip).toBe(dto.ip);
      expect(result.roomId).toBe(dto.roomId);
    });
  });

  describe('createUpsEntityFromUpdateDto', () => {
    it('should update only provided fields', async () => {
      const existing = new Ups();
      existing.name = 'OldName';
      existing.ip = 'old-ip';
      existing.roomId = 'old-room';

      const dto: UpsUpdateDto = {
        name: 'NewName',
      };

      const result = await service.createUpsEntityFromUpdateDto(existing, dto);

      expect(result.name).toBe('NewName');
      expect(result.ip).toBe('old-ip');
      expect(result.roomId).toBe('old-room');
    });

    it('should retain all values if dto is empty', async () => {
      const existing = new Ups();
      existing.name = 'UPS';
      existing.ip = '192.168.1.100';
      existing.roomId = 'room-1';

      const result = await service.createUpsEntityFromUpdateDto(existing, {});

      expect(result.name).toBe(existing.name);
      expect(result.ip).toBe(existing.ip);
      expect(result.roomId).toBe(existing.roomId);
    });
  });
});
