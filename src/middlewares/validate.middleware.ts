import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/appError';

interface RequestValidationSchema {
  query?: ZodSchema;
  params?: ZodSchema;
  body?: ZodSchema;
}

declare global {
  namespace Express {
    interface Request {
      validatedQuery?: any;
      validatedParams?: any;
      validatedBody?: any;
    }
  }
}

export function validateRequest(schemas: RequestValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params);
        req.validatedParams = parsedParams;
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);
        req.validatedQuery = parsedQuery;
      }
      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body ?? {});
        req.body = parsedBody;
        req.validatedBody = parsedBody;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return next(
          new ValidationError(
            'Tham số yêu cầu không hợp lệ: ' + (details.length > 0 ? details[0].message : 'Dữ liệu không đúng định dạng'),
            details
          )
        );
      }
      next(err);
    }
  };
}
