import { HttpException, HttpStatus } from '@nestjs/common';
import { TwoFAResponseDto } from '../../application/dto/twofa.dto';

export class TwoFAInvalidCodeException extends HttpException {
  constructor() {
    super(
      new TwoFAResponseDto(
        false,
        null,
        'Le code 2FA est invalide. Veuillez réessayer.',
      ),
      HttpStatus.UNAUTHORIZED,
    );
  }
}
