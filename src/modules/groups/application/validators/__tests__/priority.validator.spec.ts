import { validate } from 'class-validator';
import { IsPriority } from '../priority.validator';

class TestClass {
  @IsPriority()
  priority: any;
}

class TestClassWithMessage {
  @IsPriority({ message: 'Custom priority error message' })
  priority: any;
}

describe('IsPriority Validator', () => {
  describe('valid values', () => {
    it.each([1, 2, 3, 4, 10, 50, 100, 500, 999])(
      'should validate priority %i as valid',
      async (value) => {
        const testObj = new TestClass();
        testObj.priority = value;

        const errors = await validate(testObj);

        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('invalid values', () => {
    it.each([
      [0, 'Priority must be an integer between 1 and 999'],
      [1000, 'Priority must be an integer between 1 and 999'],
      [-1, 'Priority must be an integer between 1 and 999'],
      [1.5, 'Priority must be an integer between 1 and 999'],
      [2.1, 'Priority must be an integer between 1 and 999'],
      ['1', 'Priority must be an integer between 1 and 999'],
      ['two', 'Priority must be an integer between 1 and 999'],
      [null, 'Priority must be an integer between 1 and 999'],
      [undefined, 'Priority must be an integer between 1 and 999'],
      [true, 'Priority must be an integer between 1 and 999'],
      [false, 'Priority must be an integer between 1 and 999'],
      [{}, 'Priority must be an integer between 1 and 999'],
      [[], 'Priority must be an integer between 1 and 999'],
      [NaN, 'Priority must be an integer between 1 and 999'],
      [Infinity, 'Priority must be an integer between 1 and 999'],
      [-Infinity, 'Priority must be an integer between 1 and 999'],
    ])('should reject %p with message: %s', async (value, expectedMessage) => {
      const testObj = new TestClass();
      testObj.priority = value;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority');
      expect(errors[0].constraints).toBeDefined();
      expect(errors[0].constraints?.isPriority).toBe(expectedMessage);
    });
  });

  describe('edge cases', () => {
    it('should reject very large numbers', async () => {
      const testObj = new TestClass();
      testObj.priority = Number.MAX_SAFE_INTEGER;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });

    it('should reject very small numbers', async () => {
      const testObj = new TestClass();
      testObj.priority = Number.MIN_SAFE_INTEGER;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });

    it('should handle numeric strings', async () => {
      const testObj = new TestClass();
      testObj.priority = '2';

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });

    it('should handle empty string', async () => {
      const testObj = new TestClass();
      testObj.priority = '';

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });
  });

  describe('custom error message', () => {
    it('should use custom error message when provided', async () => {
      const testObj = new TestClassWithMessage();
      testObj.priority = 1000;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Custom priority error message',
      );
    });
  });

  describe('multiple properties', () => {
    class MultiplePropertiesClass {
      @IsPriority()
      priority1: any;

      @IsPriority()
      priority2: any;

      @IsPriority()
      priority3: any;
    }

    it('should validate multiple properties independently', async () => {
      const testObj = new MultiplePropertiesClass();
      testObj.priority1 = 1;
      testObj.priority2 = 1000;
      testObj.priority3 = 3;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('priority2');
    });

    it('should report errors for all invalid properties', async () => {
      const testObj = new MultiplePropertiesClass();
      testObj.priority1 = 0;
      testObj.priority2 = 1000;
      testObj.priority3 = 'invalid';

      const errors = await validate(testObj);

      expect(errors).toHaveLength(3);
      expect(errors.map((e) => e.property).sort()).toEqual([
        'priority1',
        'priority2',
        'priority3',
      ]);
    });
  });

  describe('integration with other validators', () => {
    class CombinedValidatorsClass {
      @IsPriority()
      priority: any;

      @IsPriority({ message: 'Second priority must be between 1 and 999' })
      secondPriority: any;
    }

    it('should work with multiple validators on different properties', async () => {
      const testObj = new CombinedValidatorsClass();
      testObj.priority = 2;
      testObj.secondPriority = 0;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('secondPriority');
      expect(errors[0].constraints?.isPriority).toBe(
        'Second priority must be between 1 and 999',
      );
    });
  });

  describe('type checking', () => {
    it('should differentiate between number and Number object', async () => {
      const testObj = new TestClass();
      testObj.priority = new Number(2);

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });

    it('should handle special number cases', async () => {
      const testObj = new TestClass();
      testObj.priority = -0;

      const errors = await validate(testObj);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isPriority).toBe(
        'Priority must be an integer between 1 and 999',
      );
    });
  });
});
