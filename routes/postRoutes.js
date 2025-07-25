import express from 'express';
import postController from '../controllers/postController.js';
import verifyTokenMiddleware from '../middlewares/verifyToken.js';
import upload from '../middlewares/upload.js';
import { createPostSchema } from '../validators/postValidator.js';
import { updatePostSchema } from '../validators/postValidator.js';
import { validatePostInput } from '../middlewares/validatePostInput.js';
import { validateCommentInput } from '../validators/commentValidator.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: Gestione dei post del blog
 */

/**
 * @swagger
 * /blog-multiutente/posts:
 *   post:
 *     summary: Crea un nuovo post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Titolo del post
 *               content:
 *                 type: string
 *                 example: Questo è il contenuto del post
 *               tags:
 *                 type: string
 *                 example: tech,programmazione,life
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post creato con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// CREATE a post
router.post(
  '/',
  verifyTokenMiddleware,
  upload.single('image'),
  validatePostInput(createPostSchema),
  postController.createPost
);

/**
 * @swagger
 * /blog-multiutente/posts:
 *   get:
 *     summary: Ottiene tutti i post pubblici
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Lista di post recuperata con successo
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// READ all posts
router.get('/', postController.getAllPosts);

/**
 * @swagger
 * /blog-multiutente/posts/{id}:
 *   get:
 *     summary: Ottiene un post per ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Dettagli del post
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// READ one post by ID
router.get('/:id', postController.getPostById);

/**
 * @swagger
 * /blog-multiutente/posts/{id}:
 *   patch:
 *     summary: Modifica un post esistente
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: string
 *                 example: js,node,blog
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post aggiornato con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// UPDATE a post
router.patch(
  '/:id',
  verifyTokenMiddleware,
  upload.single('image'),
  validatePostInput(updatePostSchema),
  postController.updatePost
);

/**
 * @swagger
 * /blog-multiutente/posts/{id}:
 *   delete:
 *     summary: Elimina un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post da eliminare
 *     responses:
 *       200:
 *         description: Post eliminato con successo
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// DELETE a post
router.delete('/:id', verifyTokenMiddleware, postController.deletePost);

//////////////////////////////////

/**
 * @swagger
 * /blog-multiutente/posts/{id}/comments:
 *   post:
 *     summary: Aggiunge un commento a un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Questo è un commento
 *     responses:
 *       201:
 *         description: Commento aggiunto con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// CREATE a comment on a post
router.post(
  '/:id/comments',
  verifyTokenMiddleware,
  validateCommentInput,
  postController.addComment
);

/**
 * @swagger
 * /blog-multiutente/posts/{id}/comments/{commentId}:
 *   patch:
 *     summary: Modifica un commento esistente
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del commento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: Commento aggiornato
 *     responses:
 *       200:
 *         description: Commento aggiornato con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// UPDATE a comment on a post
router.patch(
  '/:id/comments/:commentId',
  verifyTokenMiddleware,
  validateCommentInput,
  postController.updateComment
);

/**
 * @swagger
 * /blog-multiutente/posts/{id}/comments/{commentId}:
 *   delete:
 *     summary: Elimina un commento da un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del commento
 *     responses:
 *       200:
 *         description: Commento eliminato con successo
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// DELETE a comment on a post
router.delete(
  '/:id/comments/:commentId', 
  verifyTokenMiddleware, 
  postController.deleteComment
);

/**
 * @swagger
 * /blog-multiutente/posts/{id}/like:
 *   post:
 *     summary: Aggiunge un like a un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Like aggiunto con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// CREATE a like on a post
router.post(
  '/:id/like',
  verifyTokenMiddleware,
  postController.likePost
);

/**
 * @swagger
 * /blog-multiutente/posts/{id}/like/remove:
 *   delete:
 *     summary: Rimuove un like da un post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del post
 *     responses:
 *       200:
 *         description: Like rimosso con successo
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

// DELETE a like on a post
router.delete(
  '/:id/like/remove',
  verifyTokenMiddleware,
  postController.removeLike
);

export default router;