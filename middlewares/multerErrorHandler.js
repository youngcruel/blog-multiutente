import multer from 'multer';

const multerErrorHandler = (err, req, res, next) => {
  if (
    err instanceof multer.MulterError ||
    (err.message && err.message.includes('Formato immagine'))
  ) {
    return res.status(400).json({ error: err.message });
  }

  // fallback per altri errori non gestiti
  next(err);
};

export default multerErrorHandler;