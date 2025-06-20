import Joi from 'joi';

export const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(10).required(),
  tags: Joi.array().items(Joi.string().alphanum().min(1)).optional(),
});

export const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  content: Joi.string().min(10).optional(),
  tags: Joi.array().items(Joi.string().alphanum().min(1)).optional(),
});