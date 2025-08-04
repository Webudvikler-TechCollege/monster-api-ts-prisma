import { Router } from 'express';
import { createRecord, deleteRecord, getRecords } from '../controllers/favoriteController';
import { Authorize } from '../middleware/authMiddleware';

const routes = Router();
routes.get('/', getRecords);
routes.post('/', Authorize, createRecord);
routes.delete('/:id', deleteRecord);

export const favoriteRoutes = routes;
