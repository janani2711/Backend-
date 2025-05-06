import { Request, Response, NextFunction } from 'express';

export const validateProjectData = (req: Request, res: Response, next: NextFunction): void => {
  const { name, key, endDate } = req.body;

  const errors: string[] = [];

  if (!name) errors.push('Project name is required');
  if (!key) errors.push('Project key is required');
  if (!endDate) errors.push('End date is required');

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errors,
    });
    return;
  }

  next();
};

export const validateUserData = (req: Request, res: Response, next: NextFunction): void => {
  const { firstName, lastName, email } = req.body;

  const errors: string[] = [];

  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!email) errors.push('Email is required');

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      errors,
    });
    return;
  }

  next();
};
