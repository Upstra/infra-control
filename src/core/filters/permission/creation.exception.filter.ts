import { HttpStatus } from '@nestjs/common';
import { PermissionCreationException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { createSimpleMessageFilter } from '../simple-message.filter';

export const PermissionCreationExceptionFilter = createSimpleMessageFilter(
  PermissionCreationException,
  HttpStatus.INTERNAL_SERVER_ERROR,
);
