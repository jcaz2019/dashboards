import { Request, Response } from 'express';
import * as projectService from '../services/projectService';

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await projectService.getProjectMetrics();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProjectsByCompany = async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }
    
    const projects = await projectService.getProjectsByCompany(companyId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects by company' });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await projectService.getCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

export const getCapacityData = async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : undefined;
    
    if (req.query.companyId && isNaN(companyId!)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }
    
    const capacityData = await projectService.getCapacityData(companyId);
    res.json(capacityData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch capacity data' });
  }
}; 