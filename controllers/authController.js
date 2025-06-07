import User from '../models/User.js';
import { registerSchema } from '../validators/registerValidator.js';
import { loginSchema } from '../validators/loginValidator.js';
import { hashPassword } from '../utils/hashPassword.js';
import { comparePassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/jwt.js';

// POST /blog-multiutente/auth/register
const register = async (req, res) => {
  try {
    // Validazione input
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Crea nuovo utente
    const user = await User.create({ email, password: hashedPassword });

    // Crea token JWT
    const token = generateToken({ id: user._id });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

// POST /blog-multiutente/auth/login
const login = async (req, res) => {
  try {
    // Validazione input
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email, password } = req.body;

    // Cerca l'utente
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' });

    // Confronta password
    const isvalidPassword = await comparePassword(password, user.password);
    if (!isvalidPassword) return res.status(401).json({ error: 'Credenziali non valide' });

    // Crea token JWT
    const token = generateToken({ id: user._id });

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno del server' });
  }
};

export default {
  register,
  login
};