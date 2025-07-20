import { validate } from 'class-validator';
import { IsValidName } from '../is-valid-name.decorator';

class TestClass {
  @IsValidName()
  name: string;
}

describe('IsValidName Decorator', () => {
  let testObject: TestClass;

  beforeEach(() => {
    testObject = new TestClass();
  });

  describe('valid names', () => {
    it('should pass for simple names', async () => {
      testObject.name = 'John';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should pass for names with accents', async () => {
      testObject.name = 'François';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should pass for names with hyphens', async () => {
      testObject.name = 'Marie-Claire';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should pass for names with spaces', async () => {
      testObject.name = 'Jean Pierre';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should pass for names with various accented characters', async () => {
      const validNames = [
        'José',
        'Björn',
        'Müller',
        'Zoë',
        'Naïve',
        'Résumé',
        'Café',
        'André',
        'Céline',
        'Amélie',
        'Michèle',
        'Émile',
        'Séréna',
        'Ñoño',
        'Małgorzata',
        'Łukasz',
      ];

      for (const name of validNames) {
        testObject.name = name;
        const errors = await validate(testObject);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('invalid names', () => {
    it('should fail for names with emojis', async () => {
      const invalidNames = [
        'John😀',
        '😃Marie',
        'Jean🎉Pierre',
        'Test🚀',
        'Name🎯',
      ];

      for (const name of invalidNames) {
        testObject.name = name;
        const errors = await validate(testObject);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.isValidName).toContain(
          'ne peut contenir que des lettres',
        );
      }
    });

    it('should fail for names with special characters', async () => {
      const invalidNames = [
        'John@Doe',
        'Marie#',
        'Jean$Pierre',
        'Test%Name',
        'Name&More',
        'John*Doe',
        'Test+Name',
        'Name=Value',
        'John[Doe]',
        'Test{Name}',
        'Name|More',
        'John\\Doe',
        'Test/Name',
        'Name?More',
        'John<Doe>',
        'Test.Name',
        'Name,More',
        'John;Doe',
        'Test:Name',
        'Name"More',
        "John'Doe",
      ];

      for (const name of invalidNames) {
        testObject.name = name;
        const errors = await validate(testObject);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.isValidName).toContain(
          'ne peut contenir que des lettres',
        );
      }
    });

    it('should fail for numbers', async () => {
      const invalidNames = ['John123', '123Marie', 'Jean2Pierre', 'Test9'];

      for (const name of invalidNames) {
        testObject.name = name;
        const errors = await validate(testObject);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints?.isValidName).toContain(
          'ne peut contenir que des lettres',
        );
      }
    });

    it('should fail for non-string values', async () => {
      const invalidValues = [123, null, undefined, {}, [], true];

      for (const value of invalidValues) {
        testObject.name = value as any;
        const errors = await validate(testObject);
        expect(errors).toHaveLength(1);
      }
    });

    it('should fail for empty strings', async () => {
      testObject.name = '';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('should pass for single character names', async () => {
      testObject.name = 'A';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should pass for long names with only valid characters', async () => {
      testObject.name = 'Jean-Baptiste';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(0);
    });

    it('should fail for names with only spaces', async () => {
      testObject.name = '   ';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(1);
    });

    it('should fail for names with only hyphens', async () => {
      testObject.name = '---';
      const errors = await validate(testObject);
      expect(errors).toHaveLength(1);
    });
  });
});
