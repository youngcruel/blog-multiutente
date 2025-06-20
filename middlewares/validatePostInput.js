/*export const validatePostInput = (schema) => {
  return (req, res, next) => {
    const tags = req.body.tags;

    // Se tags è una stringa separata da virgole, la trasformiamo in array
    if (typeof tags === 'string') {
      req.body.tags = tags.split(',').map(tag => tag.trim());
    }

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    next();
  };
};*/

export const validatePostInput = (schema) => {
  return async (req, res, next) => {
    try {
      // Se "tags" è una stringa (caso da .field), trasformala in array
      if (typeof req.body.tags === 'string') {
        req.body.tags = req.body.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);
      }

      // Se "tags" è undefined o già array, nessun problema
      await schema.validateAsync(req.body, { abortEarly: false });
      next();
    } catch (err) {
      const errorMessages = err.details?.map(detail => detail.message) || [err.message];
      return res.status(400).json({ error: errorMessages.join(', ') });
    }
  };
};
