import { validate } from 'class-validator';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CustomValidationPipe } from '../custom-valiation.pipe';
import { BadRequestException } from '@nestjs/common';

// Test DTOs
enum TestEnum {
  OPTION_A = 'OPTION_A',
  OPTION_B = 'OPTION_B',
  OPTION_C = 'OPTION_C',
}

class TestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(TestEnum)
  type: TestEnum;
}

describe('CustomValidationPipe - Enum Validation', () => {
  let pipe: CustomValidationPipe;

  beforeEach(() => {
    pipe = new CustomValidationPipe();
  });

  it('should translate enum validation errors with actual enum values', async () => {
    const dto = new TestDto();
    dto.name = 'Test';
    dto.type = 'INVALID' as any;

    const errors = await validate(dto);
    const exception = (pipe as any).exceptionFactory(errors) as BadRequestException;
    const response = exception.getResponse() as any;

    expect(response.message).toContain(
      'type: doit être l\'une des valeurs suivantes: OPTION_A, OPTION_B, OPTION_C',
    );
  });

  it('should handle multiple enum fields', async () => {
    enum StatusEnum {
      ACTIVE = 'ACTIVE',
      INACTIVE = 'INACTIVE',
    }

    class MultiEnumDto {
      @IsEnum(TestEnum)
      type: TestEnum;

      @IsEnum(StatusEnum)
      status: StatusEnum;
    }

    const dto = new MultiEnumDto();
    dto.type = 'INVALID_TYPE' as any;
    dto.status = 'INVALID_STATUS' as any;

    const errors = await validate(dto);
    const exception = (pipe as any).exceptionFactory(errors) as BadRequestException;
    const response = exception.getResponse() as any;

    expect(response.message).toContain(
      'type: doit être l\'une des valeurs suivantes: OPTION_A, OPTION_B, OPTION_C',
    );
    expect(response.message).toContain(
      'status: doit être l\'une des valeurs suivantes: ACTIVE, INACTIVE',
    );
  });

  it('should pass validation for valid enum values', async () => {
    const dto = new TestDto();
    dto.name = 'Test';
    dto.type = TestEnum.OPTION_A;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});