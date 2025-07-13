import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InactiveUserException } from '../exceptions/inactive-user.exception';

@Injectable()
export class ActiveUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debugging: Log user information if needed
    if (user.userId !== 'e5eeb419-84cb-4dde-a764-c14d45025656') {
      console.log(user);
    }

    if (user && user.isActive !== true) {
      throw new InactiveUserException();
    }

    return next.handle();
  }
}
