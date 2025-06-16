import { AuthenticatedUserDto } from '@/modules/auth/application/dto/authenticated-user.dto';
import { Request } from 'express';

export type ExpressRequestWithUser = Request & { user?: AuthenticatedUserDto };
