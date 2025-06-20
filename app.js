import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multerErrorHandler from './middlewares/multerErrorHandler.js';
import postRoutes from './routes/postRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rotte di autenticazione
app.use('/blog-multiutente/auth', authRoutes);

// Rotte utente
app.use('/blog-multiutente/users', userRoutes);

// Rotte per gestire gli upload di file
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Rotte per i post
app.use('/blog-multiutente/posts', postRoutes);

// Dopo i router
app.use(multerErrorHandler);

// 📚 Documentazione Swagger
app.use('/blog-multiutente/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
