import { body } from 'express-validator';
import { handleValidationErrors } from '../../utils/validation';
import prisma from '../../infra/db';

/**
 * Ticket Store/Update Validation Rules
 */
export const ticketRequest = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string'),
  body('category_id')
    .optional({ nullable: true })
    .isInt()
    .withMessage('Category ID must be an integer')
    .custom(async (value) => {
      if (value) {
        const category = await prisma.ticketCategory.findUnique({
          where: { id: value },
        });
        if (!category) {
          throw new Error('Selected category is invalid');
        }
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['open', 'processed', 'resolved', 'closed'])
    .withMessage('Invalid status value'),
  handleValidationErrors,
];
