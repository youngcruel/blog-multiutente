import app from './app.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connessione a MongoDB riuscita');
    app.listen(PORT, () => {
      console.log(`🚀 Server attivo su http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('❌ Errore connessione MongoDB:', err));
