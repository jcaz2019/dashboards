import { Router } from 'express';
import * as projectController from '../controllers/projectController';

const router = Router();

router.get('/projects', projectController.getAllProjects);
router.get('/projects/company/:companyId', projectController.getProjectsByCompany);
router.get('/companies', projectController.getCompanies);
router.get('/capacity', projectController.getCapacityData);

export default router; 