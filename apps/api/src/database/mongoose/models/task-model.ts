import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    date: { type: String, required: true },
    hour: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    isFinished: { type: Boolean, required: true, default: false },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  {
    collection: 'Task',
    timestamps: true,
  },
);

taskSchema.index({ ownerId: 1, scheduledFor: 1 });
taskSchema.index({ scheduledFor: 1, isFinished: 1 });

export const TaskModel =
  mongoose.models.Task ?? mongoose.model('Task', taskSchema);
