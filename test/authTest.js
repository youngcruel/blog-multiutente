import {expect} from 'chai';
import * as chai from 'chai';
import { request } from 'chai-http';
import chaiHttp from 'chai-http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/hashPassword.js';
import sinon from 'sinon';

dotenv.config();

chai.use(chaiHttp);

// Suite di test per le rotte di autenticazione
describe('Blog Multiutente - Auth Endpoints', () => {
  before(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  after(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  // 🔐 REGISTER TESTS
  describe('POST /blog-multiutente/auth/register', () => {
    it('✅ should successfully register a new user with valid email and password', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', 'test@example.com');
    });

    it('❌ should return 500 if User.create throws an error', async () => {
  // Stub temporaneo su User.create per forzare errore
  const stub = sinon.stub(User, 'create').throws(new Error('DB error'));

  const res = await request
    .execute(app)
    .post('/blog-multiutente/auth/register')
    .send({ email: 'fail@example.com', password: 'pass123' });

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore interno del server');

  stub.restore();
    });

    it('❌ should return 400 if email is already registered', async () => {
      await User.create({ email: 'test@example.com', password: 'hashfinta' });

      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('error');
    });

    it('❌ should return 400 if email is missing from the request body', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/register')
        .send({ password: 'password123' });

      expect(res).to.have.status(400);
    });

    it('❌ should return 400 if password is too short', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/register')
        .send({ email: 'short@example.com', password: '123' });

      expect(res).to.have.status(400);
    });
  });

  // 🔐 LOGIN TESTS
  describe('POST /blog-multiutente/auth/login', () => {
    beforeEach(async () => {
      const hashed = await hashPassword('password123');
      await User.create({ email: 'login@example.com', password: hashed });
    });

    it('✅ should successfully log in a user with valid credentials', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('token');
    });

    it('❌ should return 401 if the user email does not exist', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/login')
        .send({ email: 'non@esiste.com', password: 'password123' });

      expect(res).to.have.status(401);
    });

    it('❌ should return 401 if the password is incorrect', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/login')
        .send({ email: 'login@example.com', password: 'wrongpassword' });

      expect(res).to.have.status(401);
    });

    it('❌ should return 400 if email is missing from the request body', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/login')
        .send({ password: 'password123' });

      expect(res).to.have.status(400);
    });

    it('❌ should return 400 if password is missing from the request body', async () => {
      const res = await request
        .execute(app)
        .post('/blog-multiutente/auth/login')
        .send({ email: 'login@example.com' });

      expect(res).to.have.status(400);
    });

    it('❌ should return 500 if login throws unexpected error', async () => {
  const stub = sinon.stub(User, 'findOne').throws(new Error('Unexpected error'));

  const res = await request
    .execute(app)
    .post('/blog-multiutente/auth/login')
    .send({ email: 'user@example.com', password: 'password123' });

  expect(res).to.have.status(500);
  expect(res.body).to.have.property('error', 'Errore interno del server');

  stub.restore();
    });


  });
});
