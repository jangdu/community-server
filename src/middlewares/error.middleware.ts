import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error';

export const errorHandler = (
  err: Error | AppError,
  _: Request,
  res: Response,
  __: NextFunction,
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      error: err.message,
      errors: err.errors,
    });
  }

  return res.status(500).json({
    success: false,
    error: '서버 에러가 발생했습니다.',
  });
};
