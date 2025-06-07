import Joi from 'joi';

export const updateUserSchema = Joi.object({
  username: Joi.string()
  .min(3)
  .max(30)
  .pattern(/^[a-zA-Z0-9_]+$/)
  .optional()
  .messages({
      'string.pattern.base': 'Il nome utente può contenere solo lettere, numeri e underscore'
    }),
});
