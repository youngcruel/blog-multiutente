import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String },
  profileImage: { type: String }, // URL to the profile picture
  resetPasswordToken: { type: String }, 
  resetPasswordExpires: { type: Date }, 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;