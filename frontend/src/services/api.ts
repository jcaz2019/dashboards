import axios from 'axios';
import { Project, Company, CapacityData, TaskMetrics, LeaveData } from '../types/project';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchAllProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const fetchProjectsByCompany = async (companyId: number): Promise<Project[]> => {
  const response = await api.get<Project[]>(`/projects/company/${companyId}`);
  return response.data;
};

export const fetchCompanies = async (): Promise<Company[]> => {
  const response = await api.get<Company[]>('/companies');
  return response.data;
};

export const fetchCapacityData = async (companyId?: number): Promise<CapacityData[]> => {
  const params = companyId ? { companyId } : {};
  const response = await api.get<CapacityData[]>('/capacity', { params });
  return response.data;
};

export const fetchTaskMetrics = async (companyId?: number): Promise<TaskMetrics[]> => {
  const params = companyId ? { companyId } : {};
  const response = await api.get<TaskMetrics[]>('/tasks', { params });
  return response.data;
};

export const fetchLeavesData = async (companyId?: number): Promise<LeaveData[]> => {
  const params = companyId ? { companyId } : {};
  
  // Usar solo el endpoint real, sin fallbacks
  const response = await api.get<LeaveData[]>('/leaves', { params });
  return response.data;
}; 