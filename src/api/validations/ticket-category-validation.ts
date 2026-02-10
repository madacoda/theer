import { body } from 'express-validator';
import { handleValidationErrors } from '../../utils/validation';

/**
 * TicketCategory Store/Update Validation Rules
 */
export const ticketCategoryRequest = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string'),
  handleValidationErrors,
];
