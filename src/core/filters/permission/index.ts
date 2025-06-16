import { PermissionCreationExceptionFilter } from './creation.exception.filter';
import { PermissionDeletionExceptionFilter } from './deletion.exception.filter';
import { PermissionNotFoundExceptionFilter } from './not-found.exception.filter';

export const PermissionFilters = [
  PermissionCreationExceptionFilter,
  PermissionDeletionExceptionFilter,
  PermissionNotFoundExceptionFilter,
];
