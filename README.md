# 📝 Blog Multi-user API

A RESTful API for managing a multi-user blog with authentication, post/comment CRUD, likes, and real-time notifications via Socket.IO.

## 🚀 Features

- 🔐 User registration & login (JWT-based)
- 🧾 CRUD operations for blog posts (with image upload & tags)
- 💬 Comments and likes system
- 📢 Real-time notifications with Socket.IO
- 🧼 Input validation with Joi
- 📄 Swagger API documentation
- ✅ Testing with Mocha, Chai, Sinon
- 📊 Code coverage with c8

## 🛠️ Tech Stack

- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + Bcrypt
- **Real-Time:** Socket.IO
- **Upload:** Multer
- **Testing:** Mocha, Chai, Sinon
- **Docs:** Swagger (OpenAPI)

## 📦 Installation

```bash
git clone https://github.com/youngcruel/blog-multiutente.git
cd blog-multiutente
npm install
⚙️ Environment Variables
Create a .env file in the root directory with the following:

env
Copia
Modifica
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blog
JWT_SECRET=yourSuperSecret
▶️ Run the Server
bash
Copia
Modifica
npm run dev       # Start in development mode
npm start         # Start in production
🧪 Run Tests
bash
Copia
Modifica
npm test          # Run all tests
📚 API Documentation
After starting the server, visit:

bash
Copia
Modifica
http://localhost:3000/api-docs
(Swagger UI with full endpoint documentation)

🔔 WebSocket Notifications
When a post receives a like or comment, a real-time notification is sent via Socket.IO to the post's author.

📁 Project Structure
bash
Copia
Modifica
.
├── controllers/
├── models/
├── routes/
├── middlewares/
├── validators/
├── test/
├── uploads/
├── swagger.js
└── server.js
📬 Example Requests (cURL)
Register
bash
Copia
Modifica
curl -X POST http://localhost:3000/blog-multiutente/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123"}'
Login
bash
Copia
Modifica
curl -X POST http://localhost:3000/blog-multiutente/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"test@example.com","password":"password123"}'
Get All Posts
bash
Copia
Modifica
curl -X GET http://localhost:3000/blog-multiutente/posts
Create Post (example with Postman recommended)
Use multipart/form-data with title, content, optional tags and an image file.

✅ TODO (Next Features)
Follow/Unfollow users

Persistent notifications (DB)

Admin panel

Advanced post filtering by tags/users

👨‍💻 Author
Marco Mereu
GitHub
LinkedIn

