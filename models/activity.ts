import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the interface for the Activity model
interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  action: 'created' | 'updated' | 'deleted' | 'commented' | 'assigned' | 'changed status' | 'attached' | 'added watcher';
  taskId: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  details: object | null;
  timestamp: Date;
  fieldChanged: string | null;
  oldValue: mongoose.Schema.Types.Mixed | null;
  newValue: mongoose.Schema.Types.Mixed | null;
}

// Define the schema for the Activity model
const ActivitySchema: Schema<IActivity> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['created', 'updated', 'deleted', 'commented', 'assigned', 'changed status', 'attached', 'added watcher']
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    details: {
      type: Object,
      default: null
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    fieldChanged: {
      type: String,
      default: null
    },
    oldValue: {
      type: Schema.Types.Mixed,
      default: null
    },
    newValue: {
      type: Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: false } // Optionally disable default `createdAt` and `updatedAt` timestamps
);

// Create an index for faster queries
ActivitySchema.index({ project: 1, timestamp: -1 });

// Create and export the Activity model
const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
