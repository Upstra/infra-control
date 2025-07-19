import { PermissionCreationExceptionFilter } from './creation.exception.filter';
import { PermissionDeletionExceptionFilter } from './deletion.exception.filter';
import { PermissionNotFoundExceptionFilter } from './not-found.exception.filter';
import { PermissionInvalidValueExceptionFilter } from '@/core/filters/permission/invalid-value.exception';

export const PermissionFilters = [
  PermissionCreationExceptionFilter,
  PermissionDeletionExceptionFilter,
  PermissionNotFoundExceptionFilter,
  PermissionInvalidValueExceptionFilter,
];
