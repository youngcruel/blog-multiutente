import Post from '../models/Post.js';
import { findOrCreateTags } from '../utils/findOrCreateTags.js';
import mongoose from 'mongoose';

// POST /blog-multiutente/posts
const createPost = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(403).json({ error: 'Autorizzazione fallita: Utente non trovato' });
    }

    const { title, content, tags } = req.body;
    const authorId = req.user.id;

    // Se tags è presente e non vuoto, converti i nomi in ID
    const tagIds = tags ? await findOrCreateTags(tags) : [];

    const newPost = await Post.create({
      title,
      content,
      author: authorId,
      tags: tagIds,
      image: req.file ? `/uploads/${req.file.filename}` : undefined
    });

    res.status(201).json({ message: 'Post creato con successo', post: newPost });
  } catch (error) {
    res.status(500).json({ error: 'Errore nella creazione del post' });
  }
};

// GET /blog-multiutente/posts
const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });

    const enriched = posts.map(post => ({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    }));

    res.status(200).json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero dei post' });
  }
};

// GET /blog-multiutente/posts/:id
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate('tags', 'name')
      .populate('comments.author', 'username');

    if (!post) return res.status(404).json({ error: 'Post non trovato' });

    res.status(200).json({
      ...post.toObject(),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero del post' });
  }
};

// PATCH /blog-multiutente/posts/:id
const updatePost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const postId = req.params.id;
    const userId = req.user.id;

     // Normalizza i tag: se stringa, converti in array
    if (typeof tags === 'string') {
      tags = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
    // Verifica che almeno un campo sia presente
    const noUpdates =
      !title &&
      !content &&
      (!tags || tags.length === 0) &&
      !req.file;

    if (noUpdates) {
      return res.status(400).json({ error: 'Nessun campo da aggiornare fornito' });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });
    if (post.author.toString() !== userId) return res.status(403).json({ error: 'Accesso negato' });

    if (tags) post.tags = await findOrCreateTags(tags);
    if (title) post.title = title;
    if (content) post.content = content;
    if (req.file) post.image = `/uploads/${req.file.filename}`;

    await post.save();

    res.status(200).json({ message: 'Post aggiornato con successo', post });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del post' });
  }
};

// DELETE /blog-multiutente/posts/:id
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post non trovato' });
    if (post.author.toString() !== userId) return res.status(403).json({ error: 'Accesso negato' });

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post eliminato con successo' });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante l\'eliminazione del post' });
  }
};

// POST /blog-multiutente/posts/:id/comments
const addComment = async (req, res) => {
  try {
    const postId = req.params.id;

    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: 'Il testo del commento è obbligatorio' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post non trovato' });
    }

    if (!Array.isArray(post.comments)) {
      post.comments = [];  // Inizializza se non è un array
}

    const comment = {
      author: userId,
      text,
      createdAt: new Date()
    };

    // Aggiungi il commento all'array di commenti
    post.comments.push(comment);

  await post.save();

  
    // 🔔 Notifica via socket
    const io = req.app.get('io');
    const recipientId = post.author._id.toString();
    if (recipientId !== userId) {
      io.to(recipientId).emit('notification', {
        type: 'comment',
        from: userId,
        postId: post._id.toString(),
        commentText: text,
      });
    }

    
  res.status(201).json({ 
    message: 'Commento aggiunto', 
      comment: post.comments[post.comments.length - 1]  // Restituisce l'ultimo commento appena aggiunto
   });
} catch (error) {
  res.status(500).json({ error: 'Errore durante l\'aggiunta del commento' });
}
};

// PATCH /blog-multiutente/posts/:id/comments/:commentId
const updateComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const { text } = req.body;
    const userId = req.user.id;

    // Trova il post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post non trovato' });
    }

    // Trova il commento
    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Commento non trovato' });
    }

    // Verifica che l'utente sia l'autore del commento
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ error: 'Accesso negato: non puoi modificare un commento che non hai scritto' });
    }

    // Se il testo del commento è vuoto, restituisci un errore 400
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: 'Il testo del commento è obbligatorio' });
    }

    // Aggiorna il testo del commento
    comment.text = text;
    await post.save();

    res.status(200).json({ 
      message: 'Commento aggiornato con successo', 
      comment: comment.toObject(),
      text: comment.text
    });
  } catch (error) {
    console.error('Errore durante l\'aggiornamento del commento:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiornamento del commento' });
  }
};

// DELETE /blog-multiutente/posts/:id/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const commentId = req.params.commentId;
    const userId = req.user.id;

    // Trova il post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post non trovato' });
    }

    // Trova il commento
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Commento non trovato' });
    }

    // Verifica che l'utente sia l'autore del commento
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ error: 'Accesso negato: non puoi eliminare un commento che non hai scritto' });
    }

    // Elimina il commento
    post.comments.pull({ _id: commentId });
    await post.save();

    res.status(200).json({ message: 'Commento eliminato con successo' });
  } catch (error) {
    console.error('Errore durante l\'eliminazione del commento:', error);
    res.status(500).json({ error: 'Errore durante l\'eliminazione del commento' });
  }
};

// POST /blog-multiutente/posts/:id/like
const likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Trova il post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post non trovato' });
    }

    // Verifica se l'utente ha già messo like
    if (post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Hai già messo like a questo post' });
    }

    // Aggiungi il like
    post.likes.push(userId);
    await post.save();

    // 🔔 Notifica via socket
    const io = req.app.get('io');
    const recipientId = post.author._id.toString();
    if (recipientId !== userId) {
      io.to(recipientId).emit('notification', {
        type: 'like',
        from: userId,
        postId: post._id.toString(),
      });
    }

    res.status(200).json({ message: 'Like aggiunto con successo' });
  } catch (error) {
    console.error('Errore durante l\'aggiunta del like:', error);
    res.status(500).json({ error: 'Errore durante l\'aggiunta del like' });
  }
};

// DELETE /blog-multiutente/posts/:id/like/remove
const removeLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Trova il post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post non trovato' });
    }

    // Verifica se l'utente ha messo like
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ error: 'Non hai messo like a questo post' });
    }

    // Rimuovi il like
    post.likes.pull(userId);
    await post.save();

    res.status(200).json({ message: 'Like rimosso con successo' });
  } catch (error) {
    console.error('Errore durante la rimozione del like:', error);
    res.status(500).json({ error: 'Errore durante la rimozione del like' });
  }
};

export default { 
    createPost, 
    getAllPosts, 
    getPostById, 
    updatePost, 
    deletePost,
    addComment,
    updateComment,
    deleteComment,
    likePost,
    removeLike,
  };