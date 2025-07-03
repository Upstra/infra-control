import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EntityTypesResponseDto } from '../entity-types.response.dto';

describe('EntityTypesResponseDto', () => {
  describe('constructor', () => {
    it('should create instance with valid entity types', () => {
      const entityTypes = ['Server', 'VM', 'User', 'Group'];
      const dto = new EntityTypesResponseDto(entityTypes);

      expect(dto.entityTypes).toEqual(entityTypes);
      expect(dto.entityTypes).toHaveLength(4);
    });

    it('should create instance with single entity type', () => {
      const entityTypes = ['Server'];
      const dto = new EntityTypesResponseDto(entityTypes);

      expect(dto.entityTypes).toEqual(entityTypes);
      expect(dto.entityTypes).toHaveLength(1);
    });

    it('should create instance with empty array', () => {
      const entityTypes: string[] = [];
      const dto = new EntityTypesResponseDto(entityTypes);

      expect(dto.entityTypes).toEqual([]);
      expect(dto.entityTypes).toHaveLength(0);
    });
  });

  describe('validation', () => {
    it('should pass validation with valid entity types array', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: ['Server', 'VM', 'User'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with single entity type', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: ['Server'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when entityTypes is not an array', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: 'not-an-array',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
      expect(errors[0].constraints).toHaveProperty('isArray');
    });

    it('should fail validation when entityTypes is null', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
    });

    it('should fail validation when entityTypes is undefined', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
    });

    it('should fail validation when entityTypes contains non-string values', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: ['Server', 123, 'VM'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when entityTypes is an empty array', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
      expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
    });

    it('should pass validation with complex entity type names', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: [
          'ServerGroup',
          'VirtualMachine',
          'UserAccount',
          'GroupRole',
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when entityTypes contains empty strings', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: ['Server', '', 'VM'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entityTypes');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with duplicate entity types', async () => {
      const dto = plainToClass(EntityTypesResponseDto, {
        entityTypes: ['Server', 'VM', 'Server'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('immutability', () => {
    it('should create DTO with entityTypes property', () => {
      const originalEntityTypes = ['Server', 'VM'];
      const dto = new EntityTypesResponseDto(originalEntityTypes);

      expect(dto.entityTypes).toEqual(originalEntityTypes);
      expect(dto.entityTypes).not.toBe(originalEntityTypes);
    });

    it('should have entityTypes as a property that can be accessed', () => {
      const dto = new EntityTypesResponseDto(['Server', 'VM']);

      expect(dto).toHaveProperty('entityTypes');
      expect(Array.isArray(dto.entityTypes)).toBe(true);
    });
  });
});
