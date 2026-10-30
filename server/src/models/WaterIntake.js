import mongoose from 'mongoose';

const waterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    amountMl: { type: Number, required: true, min: 0, max: 20000, default: 0 },
  },
  { timestamps: true }
);

waterSchema.index({ user: 1, date: 1 }, { unique: true });

export const WaterIntake = mongoose.model('WaterIntake', waterSchema);
