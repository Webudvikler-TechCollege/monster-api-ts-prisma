import { Router } from 'express';
import { createRecord, deleteRecord, getRecord, getRecords, updateRecord } from '../controllers/productController';

const routes = Router();
routes.get('/', getRecords);
routes.get('/:id', getRecord);
routes.post('/', createRecord);
routes.put('/:id', updateRecord);
routes.delete('/:id', deleteRecord);

export const productRoutes = routes;
