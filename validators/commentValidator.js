import Joi from 'joi';

const schema = Joi.object({
  text: Joi.string().min(1).max(500).required()
});

export const validateCommentInput = (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};