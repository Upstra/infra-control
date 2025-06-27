import { HttpStatus } from '@nestjs/common';
import { PermissionNotFoundException } from '@/modules/permissions/domain/exceptions/permission.exception';
import { createSimpleMessageFilter } from '../simple-message.filter';

export const PermissionNotFoundExceptionFilter = createSimpleMessageFilter(
  PermissionNotFoundException,
  HttpStatus.NOT_FOUND,
);
