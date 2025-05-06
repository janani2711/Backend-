import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Task } from '../models/task';
import  Project  from '../models/project';
import  User  from '../models/user';
import  Activity from '../models/activity';

// Define interfaces
interface UserRequest extends Request {
  user?: {
    id: string;
    _id?: string;
  };
}

interface ActivityLog {
  user: mongoose.Types.ObjectId;
  action: string;
  taskId: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  details?: string | null;
  fieldChanged?: string | null;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}


const validateObjectId = (id: string): boolean => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return false;
  }
  return true;
};

const logActivity = async (
  userId: mongoose.Types.ObjectId | string,
  action: string,
  taskId: mongoose.Types.ObjectId | string,
  projectId: mongoose.Types.ObjectId | string,
  details: string | null = null,
  fieldChanged: string | null = null,
  oldValue: any = null,
  newValue: any = null
): Promise<boolean> => {
  try {
    const activity = new Activity({
      user: userId,
      action,
      taskId,
      project: projectId,
      details,
      fieldChanged,
      oldValue,
      newValue,
      timestamp: new Date()
    });
    
    await activity.save();
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
};

// Get all tasks
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find()
      .populate('project') // now full project will be populated
      .populate('assignee', 'firstName lastName fullName email avatar')
      .populate('reporter', 'firstName lastName fullName')
      .populate('parentTask', 'name type');
    
    res.status(200).json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get tasks by project
export const getTasksByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'firstName lastName fullName email avatar')
      .populate('reporter', 'firstName lastName fullName')
      .populate('parentTask', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get task by ID
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate task ID
    if (!validateObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }
    
    const task = await Task.findById(id)
      .populate('project', 'name boardColumns')
      .populate('assignee', 'firstName lastName fullName email avatar')
      .populate('reporter', 'firstName lastName fullName')
      .populate('parentTask', 'name type')
      .populate('watchers', 'firstName lastName fullName');
    
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new task
export const createTask = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { 
      name, description, type, status, 
      priority, storyPoints, assignee, 
      reporter, parentTask, project, dueDate,
      timeSpent
    } = req.body;
    console.log(req.body);  // Log the entire request body

    // Validate required fields
    if (!name || !description || !project || !assignee) {
      res.status(400).json({ 
        success: false,
        message: 'Name, description, project, and assignee are required' 
      });
      return;
    }
    
    // Validate project exists
    if (!validateObjectId(project)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    
    // Validate status is valid for the project
    const defaultStatus = 'To Do';
    let taskStatus = status || defaultStatus;
    
    if (projectDoc.workflow?.statuses) {
      const validStatus = projectDoc.workflow.statuses.includes(taskStatus);
      if (!validStatus) {
        taskStatus = projectDoc.workflow.statuses[0] || defaultStatus;
      }
    } else if (projectDoc.boardColumns) {
      // Support for older project structure
      const validStatus = projectDoc.boardColumns.some((column: any) => column.name === taskStatus);
      if (!validStatus) {
        taskStatus = projectDoc.boardColumns[0]?.name || defaultStatus;
      }
    }
    
    // Validate assignee exists
    if (assignee && !validateObjectId(assignee)) {
      res.status(400).json({ success: false, message: 'Invalid assignee ID' });
      return;
    }
    
    if (assignee) {
      const assigneeDoc = await User.findById(assignee);
      if (!assigneeDoc) {
        res.status(404).json({ success: false, message: 'Assignee not found' });
        return;
      }
    }
    
    // Validate reporter if provided
    if (reporter && !validateObjectId(reporter)) {
      res.status(400).json({ success: false, message: 'Invalid reporter ID' });
      return;
    }
    
    // Validate parent task if provided
    if (parentTask) {
      if (!validateObjectId(parentTask)) {
        res.status(400).json({ success: false, message: 'Invalid parent task ID' });
        return;
      }
      
      const parentTaskDoc = await Task.findById(parentTask);
      if (!parentTaskDoc) {
        res.status(404).json({ success: false, message: 'Parent task not found' });
        return;
      }
      
      // Validate parent-child relationship
      if (type === 'subtask' && parentTaskDoc.type !== 'task') {
        res.status(400).json({ 
          success: false,
          message: 'Subtasks must have tasks as parents' 
        });
        return;
      }
      
      if ((type === 'task' || type === 'story') && parentTaskDoc.type !== 'epic') {
        res.status(400).json({ 
          success: false,
          message: 'Tasks and stories must have epics as parents' 
        });
        return;
      }
      
      if (type === 'epic') {
        res.status(400).json({ 
          success: false,
          message: 'Epics cannot have parent tasks' 
        });
        return;
      }
    } else if (type === 'subtask') {
      // Subtasks must have a parent
      res.status(400).json({ 
        success: false,
        message: 'Subtasks must have a parent task' 
      });
      return;
    }
    
    // Create the new task
    const newTask = new Task({
      name,
      description,
      type: type || 'task',
      status: taskStatus,
      priority: priority || 'medium',
      storyPoints,
      assignee,
      reporter,
      parentTask: parentTask ? new mongoose.Types.ObjectId(parentTask) : null,
      project,
      dueDate,
      timeSpent: timeSpent || 0,
      created: new Date(),
      updated: new Date()
    });
    
    const savedTask = await newTask.save();
    
    await Activity.create({
      user: req.user?._id || req.user?.id || assignee,
      action: 'created',
      taskId: newTask._id,
      project: projectDoc._id
    });
    
    res.status(201).json({
      success: true,
      task: savedTask
    });
  } catch (error: any) {
    console.error('Error creating task:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update task
export const updateTask = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get user ID with fallbacks
    const userId = req.user?.id || req.user?._id;
    
    // If no user ID in request, use the task assignee as fallback
    let actorId = userId;
    
    // Find existing task to compare changes
    const existingTask = await Task.findById(id);
    
    if (!existingTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    
    // If no user ID, use the assignee as fallback
    if (!actorId && existingTask.assignee) {
      actorId = existingTask.assignee.toString();
    }
    
    // Last resort - if still no valid user ID, use the task reporter
    if (!actorId && existingTask.reporter) {
      actorId = existingTask.reporter.toString();
    }
    
    // If we still don't have a user ID, return an error
    if (!actorId) {
      res.status(400).json({ 
        success: false, 
        message: 'No valid user ID for activity logging. Authentication required.' 
      });
      return;
    }
    
    // Rest of your existing code...
    
    // Track changes for activity logging
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    
    // Compare fields that have changed
    for (const [key, value] of Object.entries(updateData)) {
      if (value === undefined || JSON.stringify(existingTask.get(key)) === JSON.stringify(value)) {
        continue;
      }
      
      changes[key] = {
        oldValue: existingTask.get(key),
        newValue: value
      };
    }
    
    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('assignee', 'firstName lastName fullName email avatar')
    .populate('reporter', 'firstName lastName fullName');
    
    if (!updatedTask) {
      res.status(404).json({ success: false, message: 'Task not found after update' });
      return;
    }
    
    // Log activities for each changed field - using actorId now
    for (const [field, { oldValue, newValue }] of Object.entries(changes)) {
      let action = 'updated';
      
      if (field === 'status') {
        action = 'changed status';
      } else if (field === 'assignee') {
        action = 'assigned';
      }
      
      try {
        await logActivity(
          actorId, // Using our validated actorId here
          action,
          id,
          existingTask.project.toString(),
          null,
          field,
          oldValue,
          newValue
        );
      } catch (logError) {
        console.error('Error logging activity:', logError);
        // Continue execution despite logging error
      }
    }
    
    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// Delete task
export const deleteTask = async (req: UserRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    
    // Validate task ID
    if (!validateObjectId(id)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }
    
    // Find task
    const task = await Task.findById(id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }
    
    // Check if the task has children
    const hasChildren = await Task.findOne({ parentTask: id });
    if (hasChildren) {
      res.status(400).json({ 
        success: false,
        message: 'Cannot delete a task that has child tasks. Delete children first.' 
      });
      return;
    }
    
    const projectId = task.project;
    
    // Delete the task
    await Task.findByIdAndDelete(id);
    
    // Log activity
    await logActivity(
      userId as string,
      'deleted',
      id,
      projectId.toString()
    );
    
    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get child tasks
export const getChildTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    
    if (!validateObjectId(taskId)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }
    
    const childTasks = await Task.find({ parentTask: taskId })
      .populate('assignee', 'firstName lastName fullName email avatar')
      .populate('reporter', 'firstName lastName fullName');
    
    res.status(200).json({
      success: true,
      tasks: childTasks
    });
  } catch (error) {
    console.error('Error fetching child tasks:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get task summary by project
export const getTaskSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find tasks for this project
    const tasks = await Task.find({ project: projectId });
    
    // Count tasks by status
    const statusCounts: Record<string, number> = {};
    let total = 0;
    
    tasks.forEach(task => {
      total++;
      statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
    });
    
    res.json({
      success: true,
      total,
      statusCounts
    });
  } catch (error) {
    console.error('Error in tasks summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get task priority summary by project
export const getTaskPrioritySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find tasks for this project
    const tasks = await Task.find({ project: projectId });
    
    // Count tasks by priority
    const priorityCounts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    tasks.forEach(task => {
      if (task.priority && priorityCounts.hasOwnProperty(task.priority)) {
        priorityCounts[task.priority]++;
      } else if (task.priority) {
        // Handle case-insensitive keys
        const key = Object.keys(priorityCounts).find(
          k => k.toLowerCase() === task.priority.toLowerCase()
        );
        if (key) {
          priorityCounts[key]++;
        }
      }
    });
    
    res.json({
      success: true,
      priorityCounts
    });
  } catch (error) {
    console.error('Error in priority breakdown:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get tasks grouped by team member
export const getTasksByTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find tasks with populated assignee field
    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'firstName lastName fullName email avatar')
      .lean();
    
    // Group tasks by assignee
    interface TeamWorkloadUser {
      _id: mongoose.Types.ObjectId;
      name: string;
      email: string;
      avatar?: string;
    }
    
    interface TeamWorkload {
      user: TeamWorkloadUser;
      taskCount: number;
      statusBreakdown: Record<string, number>;
    }
    
    const teamWorkload: Record<string, TeamWorkload> = {};
    
    tasks.forEach(task => {
      if (task.assignee) {
        const assignee = task.assignee as any; // Type casting to access fields
        const assigneeId = assignee._id.toString();
        
        if (!teamWorkload[assigneeId]) {
          teamWorkload[assigneeId] = {
            user: {
              _id: assignee._id,
              name: assignee.fullName || `${assignee.firstName} ${assignee.lastName}`,
              email: assignee.email,
              avatar: assignee.avatar
            },
            taskCount: 0,
            statusBreakdown: {
              'To Do': 0,
              'In Progress': 0,
              'Testing': 0,
              'Done': 0
            }
          };
        }
        
        teamWorkload[assigneeId].taskCount++;
        
        // Update status breakdown
        if (teamWorkload[assigneeId].statusBreakdown.hasOwnProperty(task.status)) {
          teamWorkload[assigneeId].statusBreakdown[task.status]++;
        } else {
          teamWorkload[assigneeId].statusBreakdown[task.status] = 1;
        }
      }
    });
    
    res.json({
      success: true,
      teamWorkload: Object.values(teamWorkload)
    });
  } catch (error) {
    console.error('Error in team workload:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get tasks by type
export const getTasksByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find tasks for this project
    const tasks = await Task.find({ project: projectId });
    
    // Count tasks by type
    const typeCounts: Record<string, number> = {
      'epic': 0,
      'task': 0,
      'bug': 0,
      'subtask': 0,
      'story': 0
    };
    
    tasks.forEach(task => {
      if (typeCounts.hasOwnProperty(task.type)) {
        typeCounts[task.type]++;
      } else {
        typeCounts[task.type] = 1;
      }
    });
    
    res.json({
      success: true,
      typeCounts
    });
  } catch (error) {
    console.error('Error in task types:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get epic progress
export const getEpicProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find epics in this project
    const epics = await Task.find({ project: projectId, type: 'epic' }).lean();
    
    // For each epic, get its subtasks and count by status
    interface EpicProgress {
      _id: mongoose.Types.ObjectId;
      name: string;
      description: string;
      totalTasks: number;
      todoCount: number;
      inProgressCount: number;
      testingCount: number;
      doneCount: number;
      completionPercentage: number;
    }
    
    const epicsWithProgress: EpicProgress[] = await Promise.all(epics.map(async (epic) => {
      const subtasks = await Task.find({ 
        project: projectId, 
        parentTask: epic._id 
      }).lean();
      
      const totalTasks = subtasks.length;
      const todoCount = subtasks.filter(task => task.status === 'To Do').length;
      const inProgressCount = subtasks.filter(task => task.status === 'In Progress').length;
      const testingCount = subtasks.filter(task => task.status === 'Testing').length;
      const doneCount = subtasks.filter(task => task.status === 'Done').length;
      
      const completionPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
      
      return {
        _id: epic._id,
        name: epic.name,
        description: epic.description,
        totalTasks,
        todoCount,
        inProgressCount,
        testingCount,
        doneCount,
        completionPercentage
      };
    }));
    
    res.json({
      success: true,
      epics: epicsWithProgress
    });
  } catch (error) {
    console.error('Error in epic progress:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get recent activity
export const getRecentActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    const { limit = 10 } = req.query;

    // Fetch activities for the given project
    const activities = await Activity.find({ project: projectId })
      .populate('user', 'firstName lastName')
      .populate('taskId', 'name status type')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .lean();

    interface ProcessedActivity {
      id: mongoose.Types.ObjectId;
      user: {
        _id: mongoose.Types.ObjectId | string;
        name: string;
        avatar: string | null;
      };
      action: string;
      taskId: mongoose.Types.ObjectId | null;
      taskName: string;
      taskType: string;
      status: string;
      timestamp: Date;
      details: string | null;
      fieldChanged: string | null;
      oldValue: any;
      newValue: any;
    }

    const processedActivities: ProcessedActivity[] = activities.map((activity: any) => {
      let userName = 'Unknown User';
      let userAvatar = null;

      if (activity.user) {
        if (activity.user.fullName && activity.user.fullName !== "undefined undefined") {
          userName = activity.user.fullName;
        } else if (activity.user.firstName || activity.user.lastName) {
          userName = `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim();
        }
      }

      return {
        id: activity._id,
        user: {
          _id: activity.user?._id || activity.userId || "unknown",
          name: userName,
          avatar: userAvatar
        },
        action: activity.action,
        taskId: activity.taskId?._id || null,
        taskName: activity.taskId?.name || 'Unnamed Task',
        taskType: activity.taskId?.type || 'Task',
        status: activity.taskId?.status || 'Unknown',
        timestamp: activity.timestamp,
        details: activity.details,
        fieldChanged: activity.fieldChanged,
        oldValue: activity.oldValue,
        newValue: activity.newValue
      };
    });

    res.json({
      success: true,
      activities: processedActivities
    });
  } catch (error) {
    console.error('Error in recent activity:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get burndown chart data
export const getBurndownData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Get project details to find start/end dates
    const project = await Project.findById(projectId);
    
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    
    // Get completed tasks with their completion dates
    const completedTasks = await Task.find({
      project: projectId,
      status: 'Done',
      completedAt: { $exists: true }
    }).select('completedAt storyPoints').lean();
    
    // Get total story points for the project
    const allTasks = await Task.find({
      project: projectId
    }).select('storyPoints').lean();
    
    const totalPoints = allTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
    const burndownData: Array<{ date: string, remainingPoints: number }> = [];
    
    // Create burndown chart data
    if (project.startDate && project.endDate) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      
      // Group completed tasks by date
      const pointsByDate: Record<string, number> = {};
      completedTasks.forEach((task: any) => {
        if (task.completedAt) {
          const dateKey = task.completedAt.toISOString().split('T')[0];
          pointsByDate[dateKey] = (pointsByDate[dateKey] || 0) + (task.storyPoints || 0);
        }
      });
      
      // Generate date series from start to end
      let currentDate = new Date(startDate);
      let remainingPoints = totalPoints;
      
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        
        // Subtract points completed on this day
        if (pointsByDate[dateKey]) {
          remainingPoints -= pointsByDate[dateKey];
        }
        
        burndownData.push({
          date: dateKey,
          remainingPoints
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    res.json({
      success: true,
      totalPoints,
      burndownData
    });
  } catch (error) {
    console.error('Error in burndown data:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get available statuses for a project
export const getAvailableStatuses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find project to get workflow configuration
    const project = await Project.findById(projectId);
    
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }
    
    // Default statuses if project doesn't have custom workflow
    const defaultStatuses = ['To Do', 'In Progress', 'Testing', 'Done'];
    
    // Use project workflow statuses if available, otherwise use defaults
    let statuses = defaultStatuses;
    
    if (project.workflow?.statuses) {
      statuses = project.workflow.statuses;
    } else if (project.boardColumns) {
      // Support for older project structure
      statuses = project.boardColumns.map((column: any) => column.name);
    }
    
    res.json({
      success: true,
      statuses
    });
  } catch (error) {
    console.error('Error fetching available statuses:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all epics for a specific project
export const getAllEpicsByProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;
    
    // Validate project ID
    if (!validateObjectId(projectId)) {
      res.status(400).json({ success: false, message: 'Invalid project ID' });
      return;
    }
    
    // Find all epics in this project
    const epics = await Task.find({ 
      project: projectId, 
      type: 'epic' 
    })
    .populate('assignee', 'firstName lastName fullName email avatar')
    .populate('reporter', 'firstName lastName fullName')
    .sort({ created: -1 });
    
    res.json({
      success: true,
      epics
    });
  } catch (error) {
    console.error('Error fetching epics:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all tasks for a specific epic
// Get all tasks for a specific epic
export const getTasksByEpic = async (req: Request, res: Response): Promise<void> => {
    try {
      const { epicId } = req.params;
      
      // Validate epic ID
      if (!validateObjectId(epicId)) {
        res.status(400).json({ success: false, message: 'Invalid epic ID' });
        return;
      }
      
      // Find all tasks linked to this epic
      const tasks = await Task.find({ 
        parentTask: epicId 
      })
      .populate('assignee', 'firstName lastName fullName email avatar')
      .populate('reporter', 'firstName lastName fullName')
      .sort({ created: -1 });
      
      res.json({
        success: true,
        tasks
      });
    } catch (error) {
      console.error('Error fetching tasks by epic:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  export const reorderTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const { taskIds } = req.body as { taskIds: string[] };
  
      if (!Array.isArray(taskIds) || taskIds.length === 0) {
        res.status(400).json({
          success: false,
          message: "Invalid task IDs array",
        });
        return;
      }
  
      const updatePromises = taskIds.map((taskId, index) =>
        Task.findByIdAndUpdate(
          taskId,
          { 
            position: index,
            updatedAt: new Date(),
          },
          { new: true } // removed session
        )
      );
  
      const updatedTasks = await Promise.all(updatePromises);
  
      res.status(200).json({
        success: true,
        message: "Tasks reordered successfully",
        tasks: updatedTasks,
      });
    } catch (error: any) {
      console.error("Error reordering tasks:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  };
  
  