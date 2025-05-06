import mongoose, { Document, Schema, Model } from 'mongoose';

// Define interfaces for the document structure
export interface IBoardColumn {
  _id?: mongoose.Types.ObjectId;
  name: string;
  order: number;
}

export interface IProject extends Document {
  name: string;
  key: string;
  type: 'development' | 'business' | 'marketing' | 'research';
  category: 'software' | 'design' | 'hardware' | 'documentation';
  description?: string;
  status: 'planning' | 'active' | 'on hold' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  boardColumns: IBoardColumn[];
  startDate: Date;
  endDate: Date;
  lead?: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  tasks: mongoose.Types.ObjectId[];
  created: Date;
  updated: Date;
}

// Define a BoardColumn schema for better structure
const BoardColumnSchema = new Schema<IBoardColumn>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  key: {
    type: String,
    required: [true, 'Project key is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['development', 'business', 'marketing', 'research'],
    default: 'development'
  },
  category: {
    type: String,
    enum: ['software', 'design', 'hardware', 'documentation'],
    default: 'software'
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'on hold', 'completed'],
    default: 'planning'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  boardColumns: [BoardColumnSchema],
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  lead: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  tasks: [{
    type: Schema.Types.ObjectId,
    ref: 'Task'
  }],
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

// Add index for faster searches
ProjectSchema.index({ name: 'text', description: 'text' });

// Add a pre-save hook to set default board columns if none are provided
ProjectSchema.pre('save', function(this: IProject, next) {
  if (!this.boardColumns || this.boardColumns.length === 0) {
    this.boardColumns = [
      { name: 'To Do', order: 0 },
      { name: 'In Progress', order: 1 },
      { name: 'In Review', order: 2 },
      { name: 'Done', order: 3 }
    ];
  }
  next();
});

// Check if model exists before creating a new one to prevent overwrite during hot reloading
const Project: Model<IProject> = mongoose.models.Project 
  ? mongoose.model<IProject>('Project') 
  : mongoose.model<IProject>('Project', ProjectSchema);

export default Project;