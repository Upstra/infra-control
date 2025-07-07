import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DeleteAccountDto, DeletionReason } from '../delete-account.dto';

describe('DeleteAccountDto', () => {
  describe('validation', () => {
    it('should validate a valid DTO with reason', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        reason: DeletionReason.ADMIN_ACTION,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate a valid DTO with reason and details', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        reason: DeletionReason.POLICY_VIOLATION,
        details: 'Multiple violations of terms of service',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate an empty DTO (all fields are optional)', async () => {
      const dto = plainToInstance(DeleteAccountDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should use default reason when not provided', () => {
      const dto = new DeleteAccountDto();
      expect(dto.reason).toBe(DeletionReason.ADMIN_ACTION);
    });

    it('should fail validation with invalid reason', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        reason: 'invalid_reason',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('reason');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation with non-string details', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        reason: DeletionReason.ADMIN_ACTION,
        details: 123,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('details');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should accept all valid deletion reasons', async () => {
      const reasons = [
        DeletionReason.ADMIN_ACTION,
        DeletionReason.USER_REQUEST,
        DeletionReason.POLICY_VIOLATION,
        DeletionReason.INACTIVE_ACCOUNT,
        DeletionReason.OTHER,
      ];

      for (const reason of reasons) {
        const dto = plainToInstance(DeleteAccountDto, { reason });
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle null values correctly', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        reason: null,
        details: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // null values should be treated as optional
      expect(dto.reason).toBe(DeletionReason.ADMIN_ACTION); // default value
    });

    it('should handle undefined values correctly', async () => {
      const dto = new DeleteAccountDto();
      // Don't set any values, let the default apply

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      expect(dto.reason).toBe(DeletionReason.ADMIN_ACTION);
    });

    it('should trim whitespace from details', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        details: '  Some details with spaces  ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty string for details', async () => {
      const dto = plainToInstance(DeleteAccountDto, {
        details: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept very long details', async () => {
      const longDetails = 'a'.repeat(1000);
      const dto = plainToInstance(DeleteAccountDto, {
        details: longDetails,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('DeletionReason enum', () => {
    it('should have all expected values', () => {
      expect(DeletionReason.ADMIN_ACTION).toBe('admin_action');
      expect(DeletionReason.USER_REQUEST).toBe('user_request');
      expect(DeletionReason.POLICY_VIOLATION).toBe('policy_violation');
      expect(DeletionReason.INACTIVE_ACCOUNT).toBe('inactive_account');
      expect(DeletionReason.OTHER).toBe('other');
    });

    it('should have exactly 5 values', () => {
      const values = Object.values(DeletionReason);
      expect(values).toHaveLength(5);
    });
  });
});
