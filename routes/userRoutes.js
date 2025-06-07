import express from 'express';
import upload from '../middlewares/upload.js';
import userController from '../controllers/userController.js';
import verifyToken from '../middlewares/verifyToken.js';
import multerErrorHandler from '../middlewares/multerErrorHandler.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestione profilo utente autenticato
 */

/**
 * @swagger
 * /blog-multiutente/users/me:
 *   get:
 *     summary: Ottiene i dati del profilo dell'utente loggato
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dati profilo recuperati con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.get('/me', verifyToken, userController.getProfile);

/**
 * @swagger
 * /blog-multiutente/users/me:
 *   patch:
 *     summary: Modifica il profilo dell'utente autenticato (username e/o immagine)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: MarcoDev
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profilo aggiornato
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.patch('/me', verifyToken, upload.single('profileImage'), multerErrorHandler, userController.updateProfile);

export default router;
