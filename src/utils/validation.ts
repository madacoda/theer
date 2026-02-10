import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * handleValidationErrors
 * Middleware to check for validation errors and return them in Laravel-style format
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    
    // Group errors by field
    const formattedErrors: Record<string, string[]> = {};
    errorArray.forEach((err) => {
      const field = err.type === 'field' ? err.path : err.type;
      if (!formattedErrors[field]) {
        formattedErrors[field] = [];
      }
      formattedErrors[field].push(err.msg);
    });

    // Create the Laravel-style message
    const firstError = errorArray[0]?.msg;
    const remainingCount = errorArray.length - 1;
    const message = remainingCount > 0 
      ? `${firstError} (and ${remainingCount} more errors)` 
      : firstError;

    res.status(422).json({
      message,
      errors: formattedErrors,
    });
    return;
  }
  next();
};
