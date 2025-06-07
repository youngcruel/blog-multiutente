import User from '../models/User.js';
import { updateUserSchema } from '../validators/updateUserValidator.js';

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Esclude la password
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    res.status(200).json({
  user: {
    _id: user._id,
    email: user.email,
    username: user.username,
    profileImage: user.profileImage 
      ? `${req.protocol}://${req.get('host')}${user.profileImage}`
      : null
  }
});
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero del profilo' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

       // ✅ Validazione input con Joi
    const { error } = updateUserSchema.validate({ username });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

      // ❌ Se multer ha rifiutato il file (non immagine)
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    const updatedFields = {};
    if (username) updatedFields.username = username;
    if (req.file) updatedFields.profileImage = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    res.status(200).json({
      message: 'Profilo aggiornato',
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        profileImage: updatedUser.profileImage 
          ? `${req.protocol}://${req.get('host')}${updatedUser.profileImage}`
          : null      }
    });
  } catch (err) {
  return res.status(404).json({ error: 'Utente non trovato' });
  }
};

export default { getProfile, updateProfile };
