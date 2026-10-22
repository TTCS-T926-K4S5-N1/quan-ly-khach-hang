import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/appError';
import { ErrorCode } from '../constants/errorCodes.constant';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || null,
      },
    });
  }

  // Handle SyntaxError or Body parser error
  if ('status' in err && typeof (err as any).status === 'number' && (err as any).status === 400) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.BAD_REQUEST,
        message: 'Dữ liệu request không hợp lệ (JSON Malformed)',
        details: null,
      },
    });
  }

  console.error('[UNHANDLED ERROR]', err);

  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Đã có lỗi xảy ra từ máy chủ hệ thống',
      details: process.env.NODE_ENV === 'development' ? err.stack : null,
    },
  });
}
