import sinon from 'sinon';
import {expect} from 'chai';
import * as chai from 'chai';
import { request } from 'chai-http';
import chaiHttp from 'chai-http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import app from '../app.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/hashPassword.js';
import Post from '../models/Post.js';
import Tag from '../models/Tag.js';


dotenv.config();

chai.use(chaiHttp);

describe('Blog Multiutente - Post Endpoints', () => {
    let token;
    let userId;
    let createdPostId;
    let commentId;
    const imagePath = path.resolve('./test/assets/test.png');

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});
    await Tag.deleteMany({});

    const hashed = await hashPassword('password123');
    const user = await User.create({
      email: 'test@example.com',
      password: hashed,
      username: 'TestUser',
    });

    userId = user._id;

    const res = await request
      .execute(app)
      .post('/blog-multiutente/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    token = res.body.token;

    const postRes = await request
      .execute(app)
      .post('/blog-multiutente/posts')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Titolo Test')
      .field('content', 'Contenuto di prova')
      .field('tags', 'test')
      .attach('image', fs.readFileSync(imagePath), 'test.png');

    createdPostId = postRes.body.post._id;

    // Crea il commento
  const commentRes = await request
  .execute(app)
  .post(`/blog-multiutente/posts/${createdPostId}/comments`)
  .set('Authorization', `Bearer ${token}`)
  .send({ text: 'Questo è un commento di test' });

  commentId = commentRes.body.comment._id; // Salva l'ID del commento per i test successivi
  });

    // POST /blog-multiutente/posts
    describe('POST /blog-multiutente/posts', () => {
    it('✅ should create a new post with image and tags', async () => {
      const imagePath = path.resolve('./test/assets/test.png');

      const res = await request
        .execute(app)
        .post('/blog-multiutente/posts')
        .set('Authorization', `Bearer ${token}`)
        .field('title', 'Titolo Test')
        .field('content', 'Contenuto di test sufficientemente lungo.')
        .field('tags', 'test,blog')
        .attach('image', fs.readFileSync(imagePath), 'test.png');

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('post');
      expect(res.body.post.title).to.equal('Titolo Test');
      expect(res.body.post.tags).to.be.an('array').that.is.not.empty;
      expect(res.body.post.image).to.include('/uploads/');
    });

    it('❌ should return 400 if title is too short', async () => {
  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Hi') // troppo corto
    .field('content', 'Contenuto valido con almeno 10 caratteri')
    .field('tags', 'validtag');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.match(/title/i); // opzionale, controlla se l'errore riguarda il titolo
    });

    it('❌ should return 400 if a tag contains invalid characters', async () => {
  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Titolo valido')
    .field('content', 'Contenuto valido con almeno 10 caratteri')
    .field('tags', 'valido,@invalido,123');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.match(/tag/i);
    });

    it('❌ should return 401 if no token is provided', async () => {
  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .field('title', 'Titolo senza token')
    .field('content', 'Contenuto valido senza autenticazione');

  expect(res).to.have.status(401);
    });

    it('❌ should return 400 if uploaded file is not an image', async () => {
  const fakePath = path.resolve('./test/assets/fake.txt');

  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Titolo con file sbagliato')
    .field('content', 'Contenuto del post')
    .attach('image', fs.readFileSync(fakePath), 'fake.txt');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
    });

    it('❌ should return 400 if data is invalid (e.g. title too short)', async () => {
  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'A') // troppo corto
    .field('content', 'Valid content for the post');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
    });

    it('❌ should return 401 if no token is provided', async () => {
  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .field('title', 'Post senza token')
    .field('content', 'Questo post non dovrebbe essere autorizzato');

  expect(res).to.have.status(401);
    });

    it('❌ should return 500 if createPost throws unexpected error', async () => {
  const stub = sinon.stub(Post, 'create').throws(new Error('Unexpected error'));

  const res = await request
    .execute(app)
    .post('/blog-multiutente/posts')
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Post che fallisce')
    .field('content', 'Contenuto di errore simulato');

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore nella creazione del post');

  stub.restore();
    });
    });
    // GET /blog-multiutente/posts
    describe('GET /blog-multiutente/posts', () => {
    it('✅ should return all posts with counts and populated fields', async () => {
  await Post.create([
    {
      title: 'Post 1',
      content: 'Contenuto 1',
      author: userId,
      tags: [],
    },
    {
      title: 'Post 2',
      content: 'Contenuto 2',
      author: userId,
      tags: [],
    }
  ]);

  const res = await request
    .execute(app)
    .get('/blog-multiutente/posts');

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('results').that.is.an('array');
  expect(res.body.results.length).to.be.at.least(2);

  expect(res.body.results[0]).to.have.property('likeCount');
  expect(res.body.results[0]).to.have.property('commentCount');
  expect(res.body.results[0]).to.have.property('author');

  expect(res.body).to.have.property('total');
  expect(res.body).to.have.property('pages');
  expect(res.body).to.have.property('page');
    });

    it('✅ should return empty array if no posts exist', async () => {
  await Post.deleteMany(); 

  const res = await request
    .execute(app)
    .get('/blog-multiutente/posts');

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('results').that.is.an('array').that.is.empty;
  expect(res.body.total).to.equal(0);
  expect(res.body.pages).to.equal(0);
  expect(res.body.page).to.equal(1);
    });

    it('❌ should return 500 if getAllPosts throws an error', async () => {
  const stub = sinon.stub(Post, 'find').throws(new Error('DB error'));

  const res = await request
    .execute(app)
    .get('/blog-multiutente/posts');

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore nel recupero dei post');

  stub.restore();
    });
    });
    // GET /blog-multiutente/posts/:id
    describe('GET /blog-multiutente/posts/:id', () => {
    it('✅ should return a single post by ID', async () => {
  const res = await request
    .execute(app)
    .get(`/blog-multiutente/posts/${createdPostId}`);

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('_id', createdPostId);
  expect(res.body).to.have.property('title', 'Titolo Test');
  expect(res.body).to.have.property('content', 'Contenuto di prova');
  expect(res.body).to.have.property('likeCount', 0);
  expect(res.body).to.have.property('commentCount', 1);
    });
    
    it('❌ should return 404 if post not found', async () => {
  const fakeId = new mongoose.Types.ObjectId();
  const res = await request
    .execute(app)
    .get(`/blog-multiutente/posts/${fakeId}`);
  expect(res).to.have.status(404);
  expect(res.body).to.have.property('error', 'Post non trovato');
    });
    });
    // PATCH /blog-multiutente/posts/:id
    describe('PATCH /blog-multiutente/posts/:id', () => {
    it('✅ should update the post\'s title, content and tags', async () => {
    const res = await request
      .execute(app)
      .patch(`/blog-multiutente/posts/${createdPostId}`)
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Titolo Aggiornato')
      .field('content', 'Contenuto aggiornato del post.')
      .field('tags', 'aggiornato,nuovo');

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('message', 'Post aggiornato con successo');
    expect(res.body.post.title).to.equal('Titolo Aggiornato');
    expect(res.body.post.content).to.equal('Contenuto aggiornato del post.');
    expect(res.body.post.tags).to.be.an('array').that.is.not.empty;
    expect(res.body.post.tags[0]).to.match(/^[a-f\d]{24}$/i); // id MongoDB
    });

    it('✅ should update the post image', async () => {
  const imagePathNew = path.resolve('./test/assets/test2.png'); // immagine diversa per simulare aggiornamento

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`)
    .attach('image', fs.readFileSync(imagePathNew), 'test2.png');

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('message', 'Post aggiornato con successo');
  expect(res.body.post).to.have.property('image');
  expect(res.body.post.image).to.include('/uploads/');
    });

    it('❌ should return 400 if uploaded file is not an image', async () => {
  const fakePath = path.resolve('./test/assets/fake.txt'); // crea questo file se non esiste!

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`)
    .attach('image', fs.readFileSync(fakePath), 'fake.txt');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.match(/formato.*immagine/i); // opzionale
    });

    it('❌ should return 401 if no token is provided', async () => {
  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .field('title', 'Nuovo titolo senza token')
    .field('content', 'Contenuto aggiornato');

  expect(res).to.have.status(401);
    });

    it('❌ should return 404 if post does not exist', async () => {
  const fakePostId = new mongoose.Types.ObjectId();

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${fakePostId}`)
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Titolo inesistente')
    .field('content', 'Questo post non esiste');

  expect(res).to.have.status(404);
  expect(res.body).to.have.property('error', 'Post non trovato');
    });

    it('❌ should return 400 if the new title is too short', async () => {
  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Hi') // troppo corto
    .field('content', 'Contenuto valido per un update');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.match(/title/i);
    });

    it('❌ should return 400 if no update fields are provided', async () => {
  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`); // nessun field, nessun file

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
    });

    it('❌ should return 500 if updatePost throws unexpected error', async () => {
  const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`)
    .field('title', 'Titolo che causerà errore');

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore durante l\'aggiornamento del post');

  stub.restore();
});
});
// DELETE /blog-multiutente/posts/:id
describe('DELETE /blog-multiutente/posts/:id', () => {
    it('✅ should delete a post successfully', async () => {
  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('message', 'Post eliminato con successo');

  // Verifica che il post sia stato davvero eliminato dal DB
  const deleted = await Post.findById(createdPostId);
  expect(deleted).to.be.null;
    });

    it('❌ should return 404 if post does not exist', async () => {
  const fakePostId = new mongoose.Types.ObjectId(); // ID valido ma non esistente

  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${fakePostId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res).to.have.status(404);
  expect(res.body).to.have.property('error', 'Post non trovato');
    });

    it('❌ should return 403 if user is not the author', async () => {
  // Crea un secondo utente
  const otherUser = await User.create({
    email: 'altra@email.com',
    password: await hashPassword('password456'),
    username: 'AltroUtente'
  });

  const otherToken = (await request
    .execute(app)
    .post('/blog-multiutente/auth/login')
    .send({ email: 'altra@email.com', password: 'password456' })).body.token;

  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${otherToken}`);

  expect(res).to.have.status(403);
  expect(res.body).to.have.property('error', 'Accesso negato');
    });

    it('❌ should return 401 if no token is provided', async () => {
  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${createdPostId}`); // Nessun token

  expect(res).to.have.status(401);
    });

    it('❌ should return 500 if deletePost throws unexpected error', async () => {
  const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${createdPostId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore durante l\'eliminazione del post');

  stub.restore();
    });
});
    // POST /blog-multiutente/posts/:id/comments
describe('POST /blog-multiutente/posts/:id/comments', () => {
    it('✅ should add a comment to the post', async () => {
        const res = await request
          .execute(app)
          .post(`/blog-multiutente/posts/${createdPostId}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: 'Questo è un commento di test' });
          
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('message', 'Commento aggiunto');
        expect(res.body.comment).to.have.property('_id');  // Verifica che l'_id sia presente
        expect(res.body.comment).to.have.property('text', 'Questo è un commento di test');
        
        const updatedPost = await Post.findById(createdPostId);
        expect(updatedPost.comments.length).to.be.greaterThan(0);
    });

    it('❌ should return 400 if comment text is missing', async () => {
        const res = await request
          .execute(app)
          .post(`/blog-multiutente/posts/${createdPostId}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({});

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error');
    });

    it('❌ should return 404 if post does not exist', async () => {
        const fakePostId = new mongoose.Types.ObjectId();

        const res = await request
          .execute(app)
          .post(`/blog-multiutente/posts/${fakePostId}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: 'Commento su post finto' });

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error', 'Post non trovato');
    });

    it('❌ should return 401 if no token is provided', async () => {
        const res = await request
          .execute(app)
          .post(`/blog-multiutente/posts/${createdPostId}/comments`)
          .send({ text: 'Commento senza token' });

        expect(res).to.have.status(401);
    });

    it('❌ should return 500 if addComment throws unexpected error', async () => {
        const stub = sinon.stub(Post, 'findById').throws(new Error('Simulated DB error'));

        const res = await request
          .execute(app)
          .post(`/blog-multiutente/posts/${createdPostId}/comments`)
          .set('Authorization', `Bearer ${token}`)
          .send({ text: 'Commento che manda tutto in crash' });

        expect(res).to.have.status(500);
        expect(res.body).to.have.property('error');

        stub.restore();
    
    });
});
    // PATCH /blog-multiutente/posts/:id/comments/:commentId
describe('PATCH /blog-multiutente/posts/:id/comments/:commentId', () => {
    it('✅ should update a comment', async () => {
  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Commento modificato' });

  expect(res).to.have.status(200);
  expect(res.body).to.have.property('message', 'Commento aggiornato con successo');
  expect(res.body.comment).to.have.property('text', 'Commento modificato');
    });

    it('❌ should return 403 if user is not the author of the comment', async () => {
  const otherUser = await User.create({
    email: 'otheruser@example.com',
    password: await hashPassword('password123'),
    username: 'OtherUser'
  });

  const otherToken = (await request
    .execute(app)
    .post('/blog-multiutente/auth/login')
    .send({ email: 'otheruser@example.com', password: 'password123' })).body.token;

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
    .set('Authorization', `Bearer ${otherToken}`)
    .send({ text: 'Modifica non autorizzata' });

  expect(res).to.have.status(403);
  expect(res.body).to.have.property('error', 'Accesso negato: non puoi modificare un commento che non hai scritto');
    });

    it('❌ should return 400 if comment text is empty', async () => {
  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: ' ' });

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error', 'Il testo del commento è obbligatorio');
    });

    it('❌ should return 500 if updateComment throws unexpected error', async () => {
  const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

  const res = await request
    .execute(app)
    .patch(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ text: 'Modifica con errore' });

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore durante l\'aggiornamento del commento');

  stub.restore();
    });
});
    // DELETE /blog-multiutente/posts/:id/comments/:commentId
describe('DELETE /blog-multiutente/posts/:id/comments/:commentId', () => {
    it('✅ should delete a comment', async () => {
    const res = await request
      .execute(app)
      .delete(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('message', 'Commento eliminato con successo');

    const post = await Post.findById(createdPostId);
    const deletedComment = post.comments.id(commentId);
    expect(deletedComment).to.be.null; // Assicurati che il commento sia stato rimosso
    });

    it('❌ should return 404 if comment not found', async () => {
    const fakeCommentId = new mongoose.Types.ObjectId(); // ID valido ma non esistente

    const res = await request
      .execute(app)
      .delete(`/blog-multiutente/posts/${createdPostId}/comments/${fakeCommentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res).to.have.status(404);
    expect(res.body).to.have.property('error', 'Commento non trovato');
    });

    it('❌ should return 403 if user is not the author', async () => {
    // Crea un secondo utente
    const otherUser = await User.create({
      email: 'altra@email.com',
      password: await hashPassword('password456'),
      username: 'AltroUtente'
    });

    const otherToken = (await request
      .execute(app)
      .post('/blog-multiutente/auth/login')
      .send({ email: 'altra@email.com', password: 'password456' })).body.token;

    const res = await request
      .execute(app)
      .delete(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res).to.have.status(403);
    expect(res.body).to.have.property('error', 'Accesso negato: non puoi eliminare un commento che non hai scritto');
    });

    it('❌ should return 401 if no token is provided', async () => {
    const res = await request
      .execute(app)
      .delete(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`);

    expect(res).to.have.status(401);
    });

    it('❌ should return 500 if deleteComment throws unexpected error', async () => {
  const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

  const res = await request
    .execute(app)
    .delete(`/blog-multiutente/posts/${createdPostId}/comments/${commentId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore durante l\'eliminazione del commento');

  stub.restore();
    });
});

    // POST /blog-multiutente/posts/:id/like
describe('POST /blog-multiutente/posts/:id/like', () => {
    it('✅ should add a like to the post', async () => {
            const res = await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Like aggiunto con successo');

            const post = await Post.findById(createdPostId);
            expect(post.likes).to.include(userId);
    });

    it('❌ should return 400 if the user already liked the post', async () => {
            await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('error', 'Hai già messo like a questo post');
    });

    it('❌ should return 404 if the post does not exist', async () => {
            const fakePostId = new mongoose.Types.ObjectId();

            const res = await request
                .execute(app)
                .post(`/blog-multiutente/posts/${fakePostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('error', 'Post non trovato');
    });

    it('❌ should return 401 if no token is provided', async () => {
            const res = await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`);

            expect(res).to.have.status(401);
    });

    it('❌ should return 500 if likePost throws unexpected error', async () => {
            const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

            const res = await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('error', 'Errore durante l\'aggiunta del like');

            stub.restore();
   });
});

    // DELETE /blog-multiutente/posts/:id/like/remove
describe('POST /blog-multiutente/posts/:id/like/remove', () => {
    it('✅ should remove a like from the post', async () => {
            await request
                .execute(app)
                .post(`/blog-multiutente/posts/${createdPostId}/like`)
                .set('Authorization', `Bearer ${token}`);

            const res = await request
                .execute(app)
                .delete(`/blog-multiutente/posts/${createdPostId}/like/remove`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Like rimosso con successo');

            const post = await Post.findById(createdPostId);
            expect(post.likes).to.not.include(userId);
    });

    it('❌ should return 400 if the user did not like the post', async () => {
            const res = await request
                .execute(app)
                .delete(`/blog-multiutente/posts/${createdPostId}/like/remove`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(400);
            expect(res.body).to.have.property('error', 'Non hai messo like a questo post');
    });

    it('❌ should return 404 if the post does not exist', async () => {
            const fakePostId = new mongoose.Types.ObjectId();

            const res = await request
                .execute(app)
                .delete(`/blog-multiutente/posts/${fakePostId}/like/remove`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(404);
            expect(res.body).to.have.property('error', 'Post non trovato');
    });

    it('❌ should return 401 if no token is provided', async () => {
            const res = await request
                .execute(app)
                .delete(`/blog-multiutente/posts/${createdPostId}/like/remove`);

            expect(res).to.have.status(401);
    });

    it('❌ should return 500 if removeLike throws unexpected error', async () => {
            const stub = sinon.stub(Post, 'findById').throws(new Error('Errore simulato'));

            const res = await request
                .execute(app)
                .delete(`/blog-multiutente/posts/${createdPostId}/like/remove`)
                .set('Authorization', `Bearer ${token}`);

            expect(res).to.have.status(500);
            expect(res.body).to.have.property('error', 'Errore durante la rimozione del like');

            stub.restore();
    });
});

});
