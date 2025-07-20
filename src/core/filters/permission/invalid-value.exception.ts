import { HttpStatus } from '@nestjs/common';
import { PermissionInvalidValueException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { createSimpleMessageFilter } from '../simple-message.filter';

export const PermissionInvalidValueExceptionFilter = createSimpleMessageFilter(
  PermissionInvalidValueException,
  HttpStatus.BAD_REQUEST,
);
