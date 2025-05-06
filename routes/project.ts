import express, { Router } from 'express';
import  * as projectController from '../controllers/project';

const router: Router = express.Router();


router.route('/')
  .get(projectController.getAllProjects)
  .post(projectController.createProject);

router.route('/:id')
  .get(projectController.getProject)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);


router.route('/:id/tasks')
  .post(projectController.addTask);

router.route('/:id/tasks/:taskId')
  .put(projectController.updateTask);


router.route('/:id/favorite')
  .post(projectController.markProjectAsFavorite)
  .delete(projectController.removeProjectFromFavorites);

router.route('/:id/toggle-favorite')
  .put(projectController.toggleFavorite);


router.route('/:id/board-columns')
  .get(projectController.getProjectBoardColumns)
  .put(projectController.updateBoardColumns)
  .post(projectController.addBoardColumn);

router.route('/:id/board-columns/:columnId')
  .put(projectController.reorderBoardColumns)
  .delete(projectController.removeBoardColumn);

export default router;
