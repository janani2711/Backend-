// import mongoose, { Document, Schema, Model } from 'mongoose';


// export interface ITask extends Document {
//   name: string;
//   description: string;
//   priority: 'low' | 'medium' | 'high' | 'critical';
//   type: 'epic' | 'task' | 'subtask' | 'story' | 'bug';
//   status: string;
//   project: mongoose.Types.ObjectId;
//   reporter?: mongoose.Types.ObjectId;
//   assignee: mongoose.Types.ObjectId;
//   dueDate?: Date;
//   timeSpent: number;
//   timeRemaining?: number;
//   storyPoints?: number;
//   completedAt?: Date;
//   parentTask?: mongoose.Types.ObjectId | null;
//   watchers: mongoose.Types.ObjectId[];
//   created: Date;
//   updated: Date;
// }

// // Create the schema
// const TaskSchema = new Schema<ITask>({
//   name: {
//     type: String,
//     required: true
//   },
  
//   description: {
//     type: String,
//     required: true
//   },
  
//   priority: {
//     type: String,
//     enum: ['low', 'medium', 'high', 'critical'],
//     default: 'medium'
//   },
  
//   type: {
//     type: String,
//     enum: ['epic', 'task', 'subtask', 'story', 'bug'],  
//     default: 'task'
//   },
  
//   status: {
//     type: String,
//     required: true
//   },
  
//   project: {
//     type: Schema.Types.ObjectId,
//     ref: 'Project',
//     required: true
//   },
  
//   reporter: {
//     type: Schema.Types.ObjectId, 
//     ref: 'User'
//   },
  
//   assignee: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
  
//   dueDate: {
//     type: Date
//   },
  
//   timeSpent: {
//     type: Number, 
//     default: 0
//   },
  
//   timeRemaining: {
//     type: Number,
//     default: 0
//   },
  
//   storyPoints: {
//     type: Number,
//     default: 0
//   },
  
//   completedAt: {
//     type: Date
//   },
  
//   parentTask: {
//     type: Schema.Types.ObjectId,
//     ref: 'Task',
//     default: null
//   },
  
//   watchers: [{
//     type: Schema.Types.ObjectId,
//     ref: 'User'
//   }],
  
//   created: {
//     type: Date,
//     default: Date.now
//   },
  
//   updated: {
//     type: Date,
//     default: Date.now
//   }
// }, {
//   timestamps: true
// });


// TaskSchema.index({ name: 1, project: 1 }, { unique: true });

// TaskSchema.pre('save', async function(next) {
//   if (this.isNew || this.isModified('status')) {
//     try {
//       const Project = mongoose.model('Project');
//       const project = await Project.findById(this.project);
      
//       if (!project) {
//         return next(new Error('Project not found'));
//       }
      
//       const validStatus = project.boardColumns.some((column: any) => column.name === this.status);
      
//       if (!validStatus) {
//         return next(new Error('Invalid status for this project. Must be one of the project board columns.'));
//       }
//     } catch (error) {
//       return next(error as Error);
//     }
//   }
//   next();
// });


// TaskSchema.pre('save', async function(next) {
//   // For epics, ensure no parent is assigned
//   if (this.type === 'epic' && this.parentTask !== null) {
//     this.parentTask = null;
//   }
  

//   if (this.type === 'task' && this.parentTask) {
//     try {
//       const Task = mongoose.model('Task');
//       const parentTask = await Task.findById(this.parentTask);
      
//       if (!parentTask || parentTask.type !== 'epic') {
//         return next(new Error('Tasks can only have epics as parents'));
//       }
//     } catch (error) {
//       return next(error as Error);
//     }
//   }
  

//   if (this.type === 'subtask') {
//     if (!this.parentTask) {
//       return next(new Error('Subtasks must have a parent task'));
//     }
    
//     try {
//       const Task = mongoose.model('Task');
//       const parentTask = await Task.findById(this.parentTask);
      
//       if (!parentTask || parentTask.type !== 'task') {
//         return next(new Error('Subtasks can only have tasks as parents'));
//       }
//     } catch (error) {
//       return next(error as Error);
//     }
//   }
  
//   next();
// });


// export const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);

import mongoose, { Document, Schema, Model } from 'mongoose';
import { Request, Response } from 'express';

export interface ITask extends Document {
  name: string;
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'epic' | 'task' | 'subtask' | 'story' | 'bug';
  status: string;
  project: mongoose.Types.ObjectId;
  sprint?: mongoose.Types.ObjectId | null;
  reporter?: mongoose.Types.ObjectId;
  assignee: mongoose.Types.ObjectId;
  dueDate?: Date;
  timeSpent: number;
  timeRemaining?: number;
  storyPoints?: number;
  completedAt?: Date;
  parentTask?: mongoose.Types.ObjectId | null;
  watchers: mongoose.Types.ObjectId[];
  created: Date;
  updated: Date;
}

// Create the schema
const TaskSchema = new Schema<ITask>({
  name: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  type: {
    type: String,
    enum: ['epic', 'task', 'subtask', 'story', 'bug'],  
    default: 'task'
  },
  
  status: {
    type: String,
    required: true
  },
  
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  
  // Sprint reference - new field
  sprint: {
    type: Schema.Types.ObjectId,
    ref: 'Sprint',
    default: null
  },
  
  reporter: {
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  
  assignee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  dueDate: {
    type: Date
  },
  
  timeSpent: {
    type: Number, 
    default: 0
  },
  
  timeRemaining: {
    type: Number,
    default: 0
  },
  
  storyPoints: {
    type: Number,
    default: 0
  },
  
  completedAt: {
    type: Date
  },
  
  parentTask: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  
  watchers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
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

// Indexes for performance
TaskSchema.index({ name: 1, project: 1 }, { unique: true });
TaskSchema.index({ sprint: 1 }); // Added index for sprint queries
TaskSchema.index({ project: 1, sprint: 1 }); // Composite index for project+sprint queries

TaskSchema.pre('save', function (next) {
  if (!this.storyPoints || this.storyPoints === 0) {
    switch (this.type) {
      case 'epic':
        this.storyPoints = 3;
        break;
      case 'task':
        this.storyPoints = 2;
        break;
      case 'subtask':
        this.storyPoints = 1;
        break;
      case 'story':
        this.storyPoints = 4;
        break;
      case 'bug':
        this.storyPoints = 5;
        break;
      default:
        this.storyPoints = 0;
    }
  }
  next();
});
// Pre-save validation for project board columns
TaskSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('status')) {
    try {
      const Project = mongoose.model('Project');
      const project = await Project.findById(this.project);
      
      if (!project) {
        return next(new Error('Project not found'));
      }
      
      const validStatus = project.boardColumns.some((column: any) => column.name === this.status);
      
      if (!validStatus) {
        return next(new Error('Invalid status for this project. Must be one of the project board columns.'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Update sprint completion status when task status changes
TaskSchema.pre('save', async function(next) {
  // If status changed and task is part of a sprint
  if ((this.isModified('status') || this.isModified('sprint')) && this.sprint) {
    try {
      const Sprint = mongoose.model('Sprint');
      const sprint = await Sprint.findById(this.sprint);
      
      if (sprint) {
        const isCompleted = this.status === 'Done' || this.status === 'Completed';
        
        // Get all tasks in this sprint
        const Task = mongoose.model('Task');
        const completedCount = await Task.countDocuments({
          _id: { $in: sprint.tasks },
          status: { $in: ['Done', 'Completed'] }
        });
        
        // Update sprint's completed task count
        await Sprint.findByIdAndUpdate(this.sprint, {
          completedTasks: completedCount
        });
        
        // If this task was just completed, set completedAt date
        if (isCompleted && !this.completedAt) {
          this.completedAt = new Date();
        } else if (!isCompleted && this.completedAt) {
          // If task was uncompleted, clear completedAt
          this.completedAt = undefined;
        }
      }
    } catch (error) {
      console.error('Error updating sprint stats:', error);
      // Continue anyway to not block the task save
    }
  }
  next();
});

// Pre-save hook for task hierarchies
TaskSchema.pre('save', async function(next) {
  // For epics, ensure no parent is assigned
  if (this.type === 'epic' && this.parentTask !== null) {
    this.parentTask = null;
  }
  
  // For tasks, ensure parent is an epic if present
  if (this.type === 'task' && this.parentTask) {
    try {
      const Task = mongoose.model('Task');
      const parentTask = await Task.findById(this.parentTask);
      
      if (!parentTask || parentTask.type !== 'epic') {
        return next(new Error('Tasks can only have epics as parents'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  
  // For subtasks, require a parent task
  if (this.type === 'subtask') {
    if (!this.parentTask) {
      return next(new Error('Subtasks must have a parent task'));
    }
    
    try {
      const Task = mongoose.model('Task');
      const parentTask = await Task.findById(this.parentTask);
      
      if (!parentTask || parentTask.type !== 'task') {
        return next(new Error('Subtasks can only have tasks as parents'));
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  
  next();
});

// When removing a task from all sprints
TaskSchema.pre('save', async function(next) {
  // If sprint field was cleared
  if (this.isModified('sprint') && !this.sprint) {
    try {
      // Make sure task is removed from any sprint's tasks array
      const Sprint = mongoose.model('Sprint');
      await Sprint.updateMany(
        { tasks: this._id },
        { $pull: { tasks: this._id } }
      );
    } catch (error) {
      console.error('Error removing task from sprints:', error);
    }
  }
  next();
});

// When a task is deleted
TaskSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const Sprint = mongoose.model('Sprint');
    await Sprint.updateMany(
      { tasks: this._id },
      { $pull: { tasks: this._id } }
    );
  } catch (error) {
    console.error('Error removing task from sprints on delete:', error);
  }
  next();
});


// Static method to move a task to a sprint
TaskSchema.statics.moveToSprint = async function(taskId: string, sprintId: string | null) {
  try {
    // Find the task
    const task = await this.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    
    if (sprintId) {
      // Find the sprint
      const Sprint = mongoose.model('Sprint');
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        throw new Error('Sprint not found');
      }
      
      // Ensure task and sprint belong to same project
      if (task.project.toString() !== sprint.project.toString()) {
        throw new Error('Task and sprint must belong to the same project');
      }
      
      // Remove from any other sprint
      await Sprint.updateMany(
        { tasks: taskId, _id: { $ne: sprintId } },
        { $pull: { tasks: taskId } }
      );
      
      // Add to new sprint if not already there
      await Sprint.findByIdAndUpdate(
        sprintId,
        { $addToSet: { tasks: taskId } }
      );
      
      // Update task's sprint reference
      task.sprint = sprintId;
    } else {
      // Remove from all sprints
      const Sprint = mongoose.model('Sprint');
      await Sprint.updateMany(
        { tasks: taskId },
        { $pull: { tasks: taskId } }
      );
      
      // Clear sprint reference
      task.sprint = null;
    }
    
    await task.save();
    return task;
  } catch (error) {
    throw error;
  }
};

// Static method to get backlog tasks (tasks not in any sprint)
TaskSchema.statics.getBacklog = async function(projectId: string) {
  return this.find({
    project: projectId,
    sprint: null
  })
    .populate('assignee', 'name avatar')
    .sort({ priority: -1 });
};

// Static method to get all tasks for a sprint
TaskSchema.statics.getSprintTasks = async function(sprintId: string) {
  return this.find({ sprint: sprintId })
    .populate('assignee', 'name avatar')
    .sort({ priority: -1 });
};

// Create the model or use existing one
export const Task: Model<ITask> = mongoose.models.Task 
  ? mongoose.model<ITask>('Task') 
  : mongoose.model<ITask>('Task', TaskSchema);