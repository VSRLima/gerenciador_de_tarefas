import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, trim: true },
    role: { type: String, enum: ['BASIC', 'ADMIN'], required: true },
  },
  {
    collection: 'User',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const UserModel =
  mongoose.models.User ?? mongoose.model('User', userSchema);
