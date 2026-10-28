import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../errors/appError';
import { ErrorCode } from '../constants/errorCodes.constant';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/msexcel',
  'application/x-msexcel',
  'application/x-ms-excel',
  'application/x-excel',
  'application/x-dos_ms_excel',
  'application/xls',
  'application/x-xls',
  'application/octet-stream', // Often sent by clients / curl / postman for binary files
];

const storage = multer.memoryStorage();

const multerUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new BadRequestError(
          `Định dạng file không hợp lệ (${ext}). Hệ thống chỉ hỗ trợ file Excel (.xlsx, .xls)`,
          { allowedExtensions: ALLOWED_EXTENSIONS },
          ErrorCode.INVALID_FILE_TYPE
        )
      );
    }

    // Additional check on mimetype if provided
    if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(
        new BadRequestError(
          'Loại nội dung file không được hỗ trợ. Vui lòng tải lên file Excel hợp lệ.',
          { mimetype: file.mimetype },
          ErrorCode.INVALID_FILE_TYPE
        )
      );
    }

    cb(null, true);
  },
});

/**
 * Middleware handling single Excel file upload with field name 'file'
 */
export function uploadExcelSingle(fieldName: string = 'file') {
  const upload = multerUpload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              new BadRequestError(
                `Kích thước file vượt quá giới hạn tối đa cho phép (10MB)`,
                { maxSizeBytes: MAX_FILE_SIZE_BYTES },
                ErrorCode.FILE_TOO_LARGE
              )
            );
          }
          return next(new BadRequestError(`Lỗi tải lên file: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
}
