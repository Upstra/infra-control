import { IloExceptionFilter } from './ilo.exception.filter';
import { InvalidQueryExceptionFilter } from './invalid-query.exception.filter';
import { RoleExceptionFilter } from './role.exception.filter';
import { RoomExceptionFilter } from './room.exception.filter';
import { UserExceptionFilter } from './user.exception.filter';
import { ServerExceptionFilter } from './server.exception.filter';
import { VmExceptionFilter } from './vm.exception.filter';
import { UpsExceptionFilter } from './ups.exception.filter';
import { AuthFilters } from './auth';
import { PermissionFilters } from './permission';

export const CoreFilters = [
  IloExceptionFilter,
  InvalidQueryExceptionFilter,
  RoleExceptionFilter,
  RoomExceptionFilter,
  UserExceptionFilter,
  ServerExceptionFilter,
  VmExceptionFilter,
  UpsExceptionFilter,
  ...AuthFilters,
  ...PermissionFilters,
];
