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
import { GroupExceptionFilter } from './group.exception.filter';
import { GlobalExceptionFilter } from './global-exception.filter';
import { DuplicatePriorityExceptionFilter } from './duplicate-priority.exception.filter';

export const CoreFilters = [
  GlobalExceptionFilter,
  GroupExceptionFilter,
  IloExceptionFilter,
  InvalidQueryExceptionFilter,
  RoleExceptionFilter,
  RoomExceptionFilter,
  UserExceptionFilter,
  ServerExceptionFilter,
  VmExceptionFilter,
  UpsExceptionFilter,
  DuplicatePriorityExceptionFilter,
  ...AuthFilters,
  ...PermissionFilters,
];
