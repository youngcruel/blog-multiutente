import * as chai from 'chai';
import { io as Client } from 'socket.io-client';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../app.js';
import User from '../models/User.js';
import Post from '../models/Post.js';

const { expect } = chai;
const request = supertest(app);

describe('🔔 Socket.IO Notifiche per like e commenti', function () {
  let server, io, address, socketClient, author, liker, userToken, post;

  before(async function () {
    server = createServer(app);
    io = new IOServer(server, { cors: { origin: '*' } });
    app.set('io', io);

    io.on('connection', (socket) => {
      socket.on('join', (userId) => {
        socket.join(userId);
      });
    });

    await mongoose.connect(process.env.MONGO_URI + '_test'); // DB test
    server.listen(0);
    address = server.address();
  });

  after(async function () {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    io.close();
    server.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Post.deleteMany({});

    author = await User.create({ email: 'author@test.com', password: 'pass', username: 'Author' });
    liker = await User.create({ email: 'liker@test.com', password: 'pass', username: 'Liker' });

    post = await Post.create({
      title: 'Test Post',
      content: 'Contenuto del post',
      author: author._id,
    });

    userToken = jwt.sign({ id: liker._id }, process.env.JWT_SECRET || 'test', { expiresIn: '1h' });
  });

  describe('❤️ Like Notification', () => {
    it('✅ should send a ❤️ Like notification to the Author of the post', function (done) {
  const clientURL = `http://localhost:${address.port}`;
  socketClient = new Client(clientURL);

  socketClient.on('connect', () => {

    // Autore si unisce alla stanza
    socketClient.emit('join', author._id.toString());

    // Ascolta la notifica
    socketClient.on('notification', (data) => {
      try {
        expect(data).to.include({
          type: 'like',
          postId: post._id.toString(),
        });
        expect(data.from).to.equal(liker._id.toString());
        done();
      } catch (err) {
        done(err);
      } finally {
        socketClient.disconnect();
      }
    });

    // Triggera la rotta che genera la notifica
    request
      .post(`/blog-multiutente/posts/${post._id}/like`)
      .set('Authorization', `Bearer ${userToken}`)
      .send()
      .end((err, res) => {
        if (err) return done(err);
      });
  });

  socketClient.on('connect_error', (err) => {
    console.error('❌ Errore connessione socket:', err.message);
    done(err);
  });
    });
  });

  describe('💬 Comment Notification', () => {
    it('✅ should send a 💬 Comment notification to the Author of the post', function (done) {
  this.timeout(10000);
  const clientURL = `http://localhost:${address.port}`;
  socketClient = new Client(clientURL);

  socketClient.on('connect', () => {
    socketClient.emit('join', author._id.toString());

    socketClient.on('notification', (data) => {
      try {
        expect(data).to.include({
          type: 'comment',
          postId: post._id.toString(),
          commentText: 'Questo è un commento di test',
        });
        expect(data.from).to.equal(liker._id.toString());
        done();
      } catch (err) {
        done(err);
      } finally {
        socketClient.disconnect();
      }
    });

    request
      .post(`/blog-multiutente/posts/${post._id}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ text: 'Questo è un commento di test' })
      .end((err, res) => {
        if (err) return done(err);
      });
  });

  socketClient.on('connect_error', (err) => {
    console.error('❌ Errore connessione socket:', err.message);
    done(err);
  });
    });

  });
});