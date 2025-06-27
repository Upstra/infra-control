import { HttpStatus } from '@nestjs/common';
import { PermissionDeletionException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { createSimpleMessageFilter } from '../simple-message.filter';

export const PermissionDeletionExceptionFilter = createSimpleMessageFilter(
  PermissionDeletionException,
  HttpStatus.INTERNAL_SERVER_ERROR,
);
