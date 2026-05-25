import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
