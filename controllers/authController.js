import User from '../models/User.js';
import { registerSchema } from '../validators/registerValidator.js';
import { loginSchema } from '../validators/loginValidator.js';
import { hashPassword } from '../utils/hashPassword.js';
import { comparePassword } from '../utils/hashPassword.js';
import { generateToken } from '../utils/jwt.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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

// POST /blog-multiutente/auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: 'Utente non trovato' });

      // Genera token di reset
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minuti
      await user.save();

      // Configura il trasportatore per l'invio dell'email
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USER, // La tua email
          pass: process.env.EMAIL_PASS, // La tua password
        }
      });

      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email, 
        subject: 'Reimpostazione password',
        html: `<p>Hai richiesto la reimpostazione della password. Clicca sul link per reimpostare la password:</p>
               <a href="${resetLink}">Reimposta Password</a>
               <p>Il link scadrà tra 15 minuti.</p>`,
      });

      res.json({ message: 'Email di reimpostazione inviata con successo' });
    } catch (err) {
      res.status(500).json({ error: 'Errore nel recupero password' });
  } 
}

// POST /blog-multiutente/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ error: 'Token non valido o scaduto' });

    // Hash della nuova password
    user.password = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reimpostata con successo' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella reimpostazione della password' });
  }
};

export default {
  register,
  login,
  forgotPassword,
  resetPassword
};