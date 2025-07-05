import { HttpException, HttpStatus } from '@nestjs/common';

export class DashboardLayoutNotFoundException extends HttpException {
  constructor(layoutId: string) {
    super(
      `Dashboard layout with ID ${layoutId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DashboardLayoutNameAlreadyExistsException extends HttpException {
  constructor(name: string) {
    super(
      `Dashboard layout with name "${name}" already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class DashboardTemplateNotFoundException extends HttpException {
  constructor(templateId: string) {
    super(
      `Dashboard template with ID ${templateId} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class UnauthorizedDashboardAccessException extends HttpException {
  constructor(layoutId: string) {
    super(
      `Unauthorized access to dashboard layout ${layoutId}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidWidgetTypeException extends HttpException {
  constructor(type: string) {
    super(`Invalid widget type: ${type}`, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidWidgetPositionException extends HttpException {
  constructor(message: string) {
    super(`Invalid widget position: ${message}`, HttpStatus.BAD_REQUEST);
  }
}
