import express from 'express';
import * as taskController from '../controllers/task';


const router = express.Router();


// Get all tasks
router.get('/', taskController.getAllTasks);

// Get tasks by project
router.get('/project/:projectId', taskController.getTasksByProject);

// Get task by ID
router.get('/:id', taskController.getTaskById);

// Create new task
router.post('/', taskController.createTask);

// Update task
router.put('/:id', taskController.updateTask);

// Delete task
router.delete('/:id', taskController.deleteTask);

// Get child tasks
router.get('/children/:taskId', taskController.getChildTasks);

// Get task summary by project
router.get('/summary/:projectId', taskController.getTaskSummary);

// Get task priority summary by project
router.get('/priority-summary/:projectId', taskController.getTaskPrioritySummary);

// Get tasks grouped by team member
router.get('/team/:projectId', taskController.getTasksByTeam);

// Get tasks by type
router.get('/types/:projectId', taskController.getTasksByType);

// Get epic progress
router.get('/epic-progress/:projectId', taskController.getEpicProgress);

// Get recent activity
router.get('/activity/:projectId', taskController.getRecentActivity);

// Get burndown chart data
router.get('/burndown/:projectId', taskController.getBurndownData);

// Get available statuses for a project
router.get('/statuses/:projectId', taskController.getAvailableStatuses);

// Get all epics for a specific project
router.get('/epics/:projectId', taskController.getAllEpicsByProject);

// Get all tasks for a specific epic
router.get('/epic/:epicId', taskController.getTasksByEpic);

router.patch('/:id', taskController.updateTask);

router.post("/reorder", taskController.reorderTasks);
export default router;