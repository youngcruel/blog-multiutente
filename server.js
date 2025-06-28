import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const PORT = process.env.PORT || 3000;

// 👉 Crea server HTTP da Express
const server = http.createServer(app);

// 👉 Inizializza Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // oppure specifica il tuo frontend
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// 👉 Collega socket agli utenti
io.on('connection', (socket) => {
  console.log('🟢 Nuova connessione socket:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Disconnessione socket:', socket.id);
  });
});

// 👉 Rende `io` accessibile in tutta l’app Express
app.set('io', io);

// 🔗 Connessione a Mongo + avvio del server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connessione a MongoDB riuscita');
    server.listen(PORT, () => {
      console.log(`🚀 Server attivo su http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ Errore connessione MongoDB:', err));