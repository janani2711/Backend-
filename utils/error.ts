import { Request, Response, NextFunction } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

export const handleAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);


export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((val) => val.message);
    res.status(400).json({
      success: false,
      error: messages
    });
    return;
  }

  // Mongoose duplicate key error
  if ((err as MongoError).code === 11000) {
    res.status(400).json({
      success: false,
      error: 'Duplicate field value entered'
    });
    return;
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
};
