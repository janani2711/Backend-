import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Sprint from '../models/sprint';
import Project from '../models/project';
import { Task } from '../models/task';

// Get all sprints or filter by project
export const getAllSprints = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { project: projectId } : {};

    const sprints = await Sprint.find(query)
      .populate('project', 'name key color')
      .populate({
        path: 'tasks',
        select: 'name description status priority type assignee',
        populate: {
          path: 'assignee',
          select: 'firstName lastName email profileImage'
        }
      })
      .populate({
        path: 'team',
        select: 'firstName lastName email profileImage role department'
      })
      .sort({ startDate: -1 });

    return res.status(200).json({
      success: true,
      count: sprints.length,
      data: sprints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
// Get single sprint
export const getSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id)
      .populate('project', 'name key color')
      .populate({
        path: 'tasks',
        select: 'name description status priority type assignee',
        populate: {
          path: 'assignee',
          select: 'firstName lastName email profileImage'
        }
      })
      .populate({
        path: 'team',
        select: 'firstName lastName email profileImage role department'
      });

    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Create new sprint
export const createSprint = async (req: Request, res: Response) => {
  try {
    const { project: projectId } = req.body;
    
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const sprint = await Sprint.create(req.body);
    
    return res.status(201).json({
      success: true,
      data: sprint
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Update sprint
export const updateSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    const updatedSprint = await Sprint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name key color');
    
    return res.status(200).json({
      success: true,
      data: updatedSprint
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(error.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
};

// Delete sprint
export const deleteSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    await sprint.deleteOne();
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Add tasks to sprint
export const addTasksToSprint = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    const sprintId = req.params.id;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of task IDs'
      });
    }
    
    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    // Verify all tasks exist and belong to the same project
    const tasks = await Task.find({
      _id: { $in: taskIds },
      project: sprint.project
    });
    
    if (tasks.length !== taskIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some tasks were not found or do not belong to the project'
      });
    }
    
    // Add tasks to sprint
    const updatedSprint = await Sprint.findByIdAndUpdate(
      sprintId,
      { $addToSet: { tasks: { $each: taskIds } } },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      data: updatedSprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Remove tasks from sprint
export const removeTasksFromSprint = async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    const sprintId = req.params.id;
    
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of task IDs'
      });
    }
    
    const sprint = await Sprint.findById(sprintId);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    // Remove tasks from sprint
    const updatedSprint = await Sprint.findByIdAndUpdate(
      sprintId,
      { $pullAll: { tasks: taskIds } },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      data: updatedSprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Start sprint (change status to active)
export const startSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    if (sprint.status !== 'planning') {
      return res.status(400).json({
        success: false,
        error: 'Sprint is already active or completed'
      });
    }
    
    sprint.status = 'active';
    await sprint.save();
    
    return res.status(200).json({
      success: true,
      data: sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Complete sprint (change status to completed)
export const completeSprint = async (req: Request, res: Response) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    
    if (!sprint) {
      return res.status(404).json({
        success: false,
        error: 'Sprint not found'
      });
    }
    
    if (sprint.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Only active sprints can be completed'
      });
    }
    
    sprint.status = 'completed';
    await sprint.save();
    
    return res.status(200).json({
      success: true,
      data: sprint
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Get sprint stats
export const getSprintStats = async (req: Request, res: Response) => {
    try {
      const sprintId = req.params.id;
      
      const sprint = await Sprint.findById(sprintId);
      
      if (!sprint) {
        return res.status(404).json({
          success: false,
          error: 'Sprint not found'
        });
      }
      
      // Get tasks grouped by status
      const tasks = await Task.find({ _id: { $in: sprint.tasks } });
  
      const tasksByStatus = tasks.reduce((acc: { [key: string]: number }, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});
      
      // Calculate task counts and points
      const totalTasks = tasks.length;
  
      const completedTasksList = tasks.filter(task => 
        task.status === 'Done' || task.status === 'Completed'
      );
  
      const completedTasks = completedTasksList.length;
  
      const totalPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
      const completedPoints = completedTasksList.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  
      const progressPercentage = totalTasks > 0 
        ? (completedTasks / totalTasks) * 100 
        : 0;
      
      return res.status(200).json({
        success: true,
        data: {
          tasksByStatus,
          totalTasks,
          completedTasks,
          totalPoints,
          completedPoints,
          progressPercentage
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  
// Get active sprints for project
export const getActiveSprintsForProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const sprints = await Sprint.find({
      project: projectId,
      status: 'active'
    }).populate('project', 'name key color');
    
    return res.status(200).json({
      success: true,
      count: sprints.length,
      data: sprints
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
export const addMembersToSprint = async (req: Request, res: Response) => {
    try {
      const { memberIds } = req.body;
      const sprintId = req.params.id;
  
      if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Please provide an array of member IDs'
        });
      }
  
      const sprint = await Sprint.findById(sprintId);
      if (!sprint) {
        return res.status(404).json({
          success: false,
          error: 'Sprint not found'
        });
      }
  
      const updatedSprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { $addToSet: { team: { $each: memberIds } } },
        { new: true, runValidators: true }
      ).populate('team', 'name email avatar');
  
      return res.status(200).json({
        success: true,
        data: updatedSprint
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  };
  