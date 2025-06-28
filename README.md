# 📝 Blog Multi-user API

A RESTful API for managing a multi-user blog with authentication, posts, comments, likes, and real-time notifications via Socket.IO.

## 🚀 Features

- 🔐 User registration & login (JWT-based)
- 📄 CRUD operations for posts (with image upload & tags)
- 💬 Comments and likes system
- 📢 Real-time notifications via Socket.IO
- ✅ Input validation with Joi
- 🧪 Tests with Mocha, Chai, Sinon
- 🧼 Swagger documentation (OpenAPI)
- 📊 Code coverage with c8

## 🛠️ Tech Stack

- **Backend:** Node.js + Express  
- **Database:** MongoDB + Mongoose  
- **Authentication:** JWT + Bcrypt  
- **Validation:** Joi  
- **Real-Time:** Socket.IO  
- **File Upload:** Multer  
- **Documentation:** Swagger UI  
- **Testing:** Mocha, Chai, Sinon  

## 📦 Installation

```bash
git clone https://github.com/youngcruel/blog-multiutente.git
cd blog-multiutente
npm install
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/blog
JWT_SECRET=yourSuperSecretKey
```

## ▶️ Run the Server

```bash
npm run dev       # Start in development mode
npm start         # Start in production mode
```

## 🧪 Run Tests

```bash
npm test
```

## 📚 API Documentation

Once the server is running, access:

http://localhost:3000/blog-multiutente/api-docs

This opens the Swagger UI with full API documentation.

## 🔔 Socket.IO Notifications

Users receive real-time notifications when someone likes or comments on their post.

Example:

```js
io.to(recipientId).emit('notification', {
  type: 'like',
  from: userId,
  postId: post._id.toString()
});
```

## 🧾 Example Requests (cURL)

### Register

```bash
curl -X POST http://localhost:3000/blog-multiutente/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com", "password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/blog-multiutente/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com", "password":"password123"}'
```

### Get All Posts

```bash
curl http://localhost:3000/blog-multiutente/posts
```

### Create a Post

Use Postman or a client that supports `multipart/form-data`.  
Fields: `title`, `content`, `tags`, `image` (file)

## 📁 Folder Structure

```
blog-multiutente/
├── controllers/
├── models/
├── routes/
├── middlewares/
├── validators/
├── test/
├── uploads/
├── swagger.js
├── app.js
└── server.js
```

## 🧠 TODOs

- [ ] Follow/Unfollow system  
- [ ] Notification center with DB  
- [ ] Admin roles  
- [ ] Filters: by tag, author, date  

## 👨‍💻 Author

**Marco Mereu**

- GitHub: https://github.com/youngcruel  
- LinkedIn: https://www.linkedin.com/in/marco-mereu-62b7182b5  

> “its cruel season. this shit too cruel.”
