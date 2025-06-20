import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // evita duplicati
    trim: true,
    lowercase: true,
  }
}, {
  timestamps: true,
});

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;