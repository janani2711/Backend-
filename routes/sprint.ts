import express from 'express';
import {
  getAllSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint,
  addTasksToSprint,
  removeTasksFromSprint,
  startSprint,
  completeSprint,
  getSprintStats,
  addMembersToSprint,
  getActiveSprintsForProject
} from '../controllers/sprint';

const router = express.Router();

// Base routes
router.route('/')
  .get(getAllSprints)
  .post(createSprint);

router.route('/:id')
  .get(getSprint)
  .put(updateSprint)
  .delete(deleteSprint);

// Task routes
router.route('/:id/tasks')
  .post(addTasksToSprint)
  .delete(removeTasksFromSprint);

// Sprint status routes
router.route('/:id/start').put(startSprint);
router.route('/:id/complete').put(completeSprint);

// Stats route
router.route('/:id/stats').get(getSprintStats);

// Active sprints for a project
router.route('/project/:projectId/active')
  .get(getActiveSprintsForProject);

router.route('/:id/team').post(addMembersToSprint);

export default router;
