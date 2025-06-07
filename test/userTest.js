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
import { generateFakeToken } from '../utils/jwt.js';
import multer from 'multer';
import multerErrorHandler from '../middlewares/multerErrorHandler.js';

dotenv.config();

chai.use(chaiHttp);

describe('Blog Multiutente - User Endpoints', () => {
  let token;
  let userId;

  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});

    const hashed = await hashPassword('password123');
    const user = await User.create({ email: 'user@example.com', password: hashed, username: 'OldName' });
    userId = user._id;

    const res = await request
      .execute(app)
      .post('/blog-multiutente/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });

    token = res.body.token;
  });

  // GET /users/me
  describe('GET /blog-multiutente/users/me', () => {
    it('✅ should return user profile data', async () => {
      const res = await request
        .execute(app)
        .get('/blog-multiutente/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.have.status(200);
      expect(res.body.user).to.have.property('_id');
      expect(res.body.user).to.have.property('email', 'user@example.com');
      expect(res.body.user).to.have.property('username', 'OldName');
    });

    it('❌ should return 401 if no token is provided', async () => {
      const res = await request 
      .execute(app)
      .get('/blog-multiutente/users/me');
      expect(res).to.have.status(401);
    });

    it('❌ should return 500 if getProfile throws unexpected error', async () => {
  const stub = sinon.stub(User, 'findById').throws(new Error('Unexpected error'));

  const res = await request
    .execute(app)
    .get('/blog-multiutente/users/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore nel recupero del profilo');

  stub.restore();
    });

  });

  // PATCH /users/me
  describe('PATCH /blog-multiutente/users/me', () => {
    it('✅ should update the username', async () => {
      const res = await request
        .execute(app)
        .patch('/blog-multiutente/users/me')
        .set('Authorization', `Bearer ${token}`)
        .field('username', 'NewUsername');

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Profilo aggiornato');
      expect(res.body.user.username).to.equal('NewUsername');
    });

    it('✅ should update profile image', async () => {
      const imagePath = path.resolve('./test/assets/test.png');

      const res = await request
        .execute(app)
        .patch('/blog-multiutente/users/me')
        .set('Authorization', `Bearer ${token}`)
        .attach('profileImage', fs.readFileSync(imagePath), 'test.png');

      expect(res).to.have.status(200);
      expect(res.body.user.profileImage).to.be.a('string');
      expect(res.body.user.profileImage).to.include('/uploads/');
    });

    it('✅ should update both username and profileImage', async () => {
  const imagePath = path.resolve('./test/assets/test.png');

  const res = await request
    .execute(app)
    .patch('/blog-multiutente/users/me')
    .set('Authorization', `Bearer ${token}`)
    .field('username', 'UpdatedUser')
    .attach('profileImage', fs.readFileSync(imagePath), 'test.png');

  expect(res).to.have.status(200);
  expect(res.body.user.username).to.equal('UpdatedUser');
  expect(res.body.user.profileImage).to.include('/uploads/');
    });

    it('❌ should return 400 if username is too short', async () => {
      const res = await request
        .execute(app)
        .patch('/blog-multiutente/users/me')
        .set('Authorization', `Bearer ${token}`)
        .field('username', 'ab');

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });

    it('❌ should return 401 if no token is provided', async () => {
      const res = await request
        .execute(app)
        .patch('/blog-multiutente/users/me')
        .field('username', 'TestUser');

      expect(res).to.have.status(401);
    });

    it('❌ should return 400 if uploaded file is not an image', async () => {
  const filePath = path.resolve('./test/assets/fake.txt');

  const res = await request
    .execute(app)
    .patch('/blog-multiutente/users/me')
    .set('Authorization', `Bearer ${token}`)
    .attach('profileImage', fs.readFileSync(filePath), 'fake.txt');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
    });

    it('❌ should return 404 if user does not exist', async () => {
  const nonExistentUserId = new mongoose.Types.ObjectId(); // ID valido ma non esistente
  const fakeToken = `Bearer ${generateFakeToken(nonExistentUserId.toString())}`;

  const res = await request
    .execute(app)
    .patch('/blog-multiutente/users/me')
    .set('Authorization', fakeToken)
    .field('username', 'UserGhost');

  expect(res).to.have.status(404);
  expect(res.body).to.have.property('error', 'Utente non trovato');
    });

    it('❌ should return 400 if username contains invalid characters', async () => {
  const res = await request
    .execute(app)
    .patch('/blog-multiutente/users/me')
    .set('Authorization', `Bearer ${token}`)
    .field('username', 'Marco@123!');

  expect(res).to.have.status(400);
  expect(res.body).to.have.property('error');
  expect(res.body.error).to.match(/solo lettere, numeri e underscore/i);
    });

    it('❌ should return 404 if update operation throws unexpected error', async () => {
  const stub = sinon.stub(User, 'findByIdAndUpdate').throws(new Error('Unexpected error'));

  try {
    const res = await request
      .execute(app)
      .patch('/blog-multiutente/users/me')
      .set('Authorization', `Bearer ${token}`)
      .field('username', 'ErroreTest');

    expect(res).to.have.status(404);
    expect(res.body).to.have.property('error', 'Utente non trovato');
  } finally {
    stub.restore(); // ✅ viene eseguito anche in caso di errore
  }
  });



  });
});

// Gestione errori multer
describe('Middleware - multerErrorHandler', () => {
  it('✅ should handle MulterError and respond with 400', () => {
    const err = new multer.MulterError('LIMIT_FILE_SIZE');
    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.spy();

    multerErrorHandler(err, req, res, next);

    expect(res.status.calledOnceWith(400)).to.be.true;
    expect(res.json.calledOnceWith({ error: err.message })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('✅ should handle custom validation error with image format message', () => {
    const err = new Error('Formato immagine non valido. Sono accettati solo jpg, jpeg, png, gif e webp.');
    const req = {};
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    const next = sinon.spy();

    multerErrorHandler(err, req, res, next);

    expect(res.status.calledOnceWith(400)).to.be.true;
    expect(res.json.calledOnceWith({ error: err.message })).to.be.true;
    expect(next.notCalled).to.be.true;
  });

  it('✅ should call next for unrelated errors', () => {
    const err = new Error('Errore generico');
    const req = {};
    const res = {
      status: sinon.stub(),
      json: sinon.stub()
    };
    const next = sinon.spy();

    multerErrorHandler(err, req, res, next);

    expect(next.calledOnceWith(err)).to.be.true;
    expect(res.status.notCalled).to.be.true;
    expect(res.json.notCalled).to.be.true;
  });
});