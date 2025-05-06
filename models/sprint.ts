import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISprint extends Document {
  name: string;
  project: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  goal?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  tasks: mongoose.Types.ObjectId[];
  completedTasks: number;
  team: mongoose.Types.ObjectId[];
  totalTasks: number;
  created: Date;
  updated: Date;
}

const SprintSchema = new Schema<ISprint>({
  name: {
    type: String,
    required: [true, 'Sprint name is required'],
    trim: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Sprint start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'Sprint end date is required']
  },
  goal: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
  completedTasks: {
    type: Number,
    default: 0
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // or whatever your user model is named
  }],
  totalTasks: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validate start date is before end date
SprintSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    if (new Date(this.startDate) >= new Date(this.endDate)) {
      return next(new Error('Sprint start date must be before end date'));
    }
  }
  next();
});

// Update task counts
SprintSchema.pre('save', async function(next) {
  if (this.isModified('tasks')) {
    this.totalTasks = this.tasks.length;
    
    try {
      const Task = mongoose.model('Task');
      const completedCount = await Task.countDocuments({
        _id: { $in: this.tasks },
        status: { $in: ['Done', 'Completed'] }
      });
      
      this.completedTasks = completedCount;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Check if model exists before creating a new one to prevent overwrite during hot reloading
const Sprint: Model<ISprint> = mongoose.models.Sprint 
  ? mongoose.model<ISprint>('Sprint') 
  : mongoose.model<ISprint>('Sprint', SprintSchema);

export default Sprint;