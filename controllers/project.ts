import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Project, { IProject, IBoardColumn } from '../models/project';
import { handleAsync } from '../utils/error';

// Define interfaces for request params and bodies
interface ProjectQuery {
  page?: string;
  sort?: string;
  limit?: string;
  fields?: string;
  [key: string]: any;
}

interface BoardColumnRequest {
  name: string;
  order?: number;
}

interface ReorderDirectionRequest {
  direction: 'up' | 'down';
}

// Get all projects with filtering and pagination
export const getAllProjects = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const queryObj: ProjectQuery = { ...req.query };
  const excludedFields: string[] = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete queryObj[field]);
  
  let query = Project.find(queryObj)
    .populate('lead', 'firstName lastName email profileImage')
    .populate('assignees', 'firstName lastName email profileImage');
  
  const page: number = parseInt(req.query.page as string, 10) || 1;
  const limit: number = parseInt(req.query.limit as string, 10) || 10;
  const startIndex: number = (page - 1) * limit;
  
  query = query.skip(startIndex).limit(limit);
  
  const projects = await query;
  const total = await Project.countDocuments(queryObj);
  
  res.status(200).json({
    success: true,
    count: projects.length,
    total,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit)
    },
    data: projects
  });
});

// Get single project
export const getProject = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id)
    .populate('lead', 'firstName lastName email profileImage')
    .populate('assignees', 'firstName lastName email profileImage')
    .populate('tasks.assignee', 'firstName lastName email profileImage');
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  res.status(200).json({ success: true, data: project });
});

// Create new project
export const createProject = handleAsync(async (req: Request, res: Response): Promise<void> => {
  // Extract board columns from request if available
  const { boardColumns, ...projectData } = req.body;
  
  // Format board columns with proper ordering if provided
  if (boardColumns && Array.isArray(boardColumns)) {
    projectData.boardColumns = boardColumns.map((column: BoardColumnRequest, index: number) => ({
      name: column.name,
      order: index
    }));
  }
  
  const project = await Project.create(projectData);
  res.status(201).json({ success: true, data: project });
});

// Update project
export const updateProject = handleAsync(async (req: Request, res: Response): Promise<void> => {
  // Extract and format board columns if included in update
  const { boardColumns, ...updateData } = req.body;
  
  if (boardColumns && Array.isArray(boardColumns)) {
    updateData.boardColumns = boardColumns.map((column: BoardColumnRequest, index: number) => ({
      name: column.name,
      order: index
    }));
  }
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updated: Date.now() },
    { new: true, runValidators: true }
  ).populate('lead', 'firstName lastName email profileImage')
   .populate('assignees', 'firstName lastName email profileImage');
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  res.status(200).json({ success: true, data: project, message: 'Project updated successfully' });
});

// Delete project
export const deleteProject = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findByIdAndDelete(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  res.status(200).json({ success: true, data: {}, message: 'Project deleted successfully' });
});

// Get project board columns
export const getProjectBoardColumns = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id).select('boardColumns');
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  res.status(200).json({ 
    success: true, 
    data: project.boardColumns || [] 
  });
});

// Update project board columns
export const updateBoardColumns = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const { boardColumns } = req.body;
  
  if (!boardColumns || !Array.isArray(boardColumns)) {
    res.status(400).json({ 
      success: false, 
      message: 'Board columns array is required' 
    });
    return;
  }
  
  // Format columns with proper ordering
  const formattedColumns = boardColumns.map((column: BoardColumnRequest, index: number) => ({
    name: column.name,
    order: index
  }));
  
  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { 
      boardColumns: formattedColumns,
      updated: Date.now() 
    },
    { new: true, runValidators: true }
  );
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  res.status(200).json({ 
    success: true, 
    data: project.boardColumns,
    message: 'Board columns updated successfully' 
  });
});

// Add a single board column
export const addBoardColumn = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ 
      success: false, 
      message: 'Column name is required' 
    });
    return;
  }
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  // Initialize boardColumns array if it doesn't exist
  if (!project.boardColumns) {
    project.boardColumns = [];
  }
  
  // Add new column with the next order value
  const newColumn: IBoardColumn = {
    _id: new mongoose.Types.ObjectId(),
    name,
    order: project.boardColumns.length
  };
  
  project.boardColumns.push(newColumn);
  project.updated = Date.now();
  await project.save();
  
  res.status(200).json({ 
    success: true, 
    data: project.boardColumns,
    message: 'Board column added successfully' 
  });
});

// Remove a board column
export const removeBoardColumn = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const { columnId } = req.params;
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  // Find the column index
  const columnIndex = project.boardColumns.findIndex(
    column => column._id.toString() === columnId
  );
  
  if (columnIndex === -1) {
    res.status(404).json({ success: false, message: 'Column not found' });
    return;
  }
  
  // Remove the column
  project.boardColumns.splice(columnIndex, 1);
  
  // Reorder remaining columns
  project.boardColumns = project.boardColumns.map((col, idx) => ({
    ...col.toObject ? col.toObject() : col,
    order: idx
  }));
  
  project.updated = Date.now();
  await project.save();
  
  res.status(200).json({ 
    success: true, 
    data: project.boardColumns,
    message: 'Board column removed successfully' 
  });
});

// Reorder board columns
export const reorderBoardColumns = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const { columnId } = req.params;
  const { direction } = req.body as ReorderDirectionRequest;
  
  if (!direction || (direction !== 'up' && direction !== 'down')) {
    res.status(400).json({ 
      success: false, 
      message: 'Valid direction (up or down) is required' 
    });
    return;
  }
  
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  // Find the column index
  const columnIndex = project.boardColumns.findIndex(
    column => column._id.toString() === columnId
  );
  
  if (columnIndex === -1) {
    res.status(404).json({ success: false, message: 'Column not found' });
    return;
  }
  
  // Can't move first column up or last column down
  if ((direction === 'up' && columnIndex === 0) || 
      (direction === 'down' && columnIndex === project.boardColumns.length - 1)) {
    res.status(400).json({ 
      success: false, 
      message: `Cannot move column ${direction}` 
    });
    return;
  }
  
  // Swap positions with adjacent column
  const adjacentIndex = direction === 'up' ? columnIndex - 1 : columnIndex + 1;
  const temp = project.boardColumns[columnIndex];
  project.boardColumns[columnIndex] = project.boardColumns[adjacentIndex];
  project.boardColumns[adjacentIndex] = temp;
  
  // Update order values
  project.boardColumns = project.boardColumns.map((col, idx) => ({
    ...col.toObject ? col.toObject() : col,
    order: idx
  }));
  
  project.updated = Date.now();
  await project.save();
  
  res.status(200).json({ 
    success: true, 
    data: project.boardColumns,
    message: `Column moved ${direction} successfully` 
  });
});

// Add task to project
export const addTask = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  // Validate that task status is one of the project's board columns
  if (req.body.status) {
    const validStatus = project.boardColumns && project.boardColumns.some(
      column => column.name === req.body.status
    );
    
    if (!validStatus) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of the project board columns.',
        validColumns: project.boardColumns.map(col => col.name)
      });
      return;
    }
  } else if (project.boardColumns && project.boardColumns.length > 0) {
    // Set default status to the first column if not provided
    req.body.status = project.boardColumns[0].name;
  }
  
  project.tasks.push(req.body);
  await project.save();
  
  res.status(200).json({ success: true, data: project });
});

// Update task
export const updateTask = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  const taskIndex = project.tasks.findIndex(task => task._id.toString() === req.params.taskId);
  
  if (taskIndex === -1) {
    res.status(404).json({ success: false, message: 'Task not found' });
    return;
  }
  
  // Validate status if being updated
  if (req.body.status) {
    const validStatus = project.boardColumns && project.boardColumns.some(
      column => column.name === req.body.status
    );
    
    if (!validStatus) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of the project board columns.',
        validColumns: project.boardColumns.map(col => col.name)
      });
      return;
    }
  }
  
  project.tasks[taskIndex] = { ...project.tasks[taskIndex].toObject(), ...req.body };
  await project.save();
  
  res.status(200).json({ success: true, data: project });
});

// Toggle project favorite status
export const toggleFavorite = handleAsync(async (req: Request, res: Response): Promise<void> => {
  const project = await Project.findById(req.params.id);
  
  if (!project) {
    res.status(404).json({ success: false, message: 'Project not found' });
    return;
  }
  
  project.isFavorite = !project.isFavorite;
  await project.save();
  
  res.status(200).json({ 
    success: true, 
    data: project, 
    message: `Project ${project.isFavorite ? 'added to' : 'removed from'} favorites` 
  });
});

// Mark project as favorite
export const markProjectAsFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found"
      });
      return;
    }

    // Update project to mark as favorite
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { isFavorite: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Project marked as favorite successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("Error marking project as favorite:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark project as favorite",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Remove project from favorites
export const removeProjectFromFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if project exists
    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found"
      });
      return;
    }

    // Update project to remove from favorites
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { isFavorite: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Project removed from favorites successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("Error removing project from favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove project from favorites",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};