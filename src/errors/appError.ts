import { ErrorCode } from '../constants/errorCodes.constant';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, errorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any, errorCode: ErrorCode = ErrorCode.BAD_REQUEST) {
    super(message, 400, errorCode, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, ErrorCode.NOT_FOUND, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Vui lòng đăng nhập để tiếp tục', details?: any) {
    super(message, 401, ErrorCode.UNAUTHORIZED, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Bạn không có quyền thực hiện thao tác này', details?: any) {
    super(message, 403, ErrorCode.FORBIDDEN, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Dữ liệu bị trùng lặp hoặc xung đột', details?: any) {
    super(message, 409, ErrorCode.CONFLICT, details);
  }
}

