import { useQuery } from '@tanstack/react-query';
import { fetchAllProjects, fetchProjectsByCompany, fetchCompanies, fetchCapacityData, fetchTaskMetrics, fetchLeavesData } from '../services/api';

export const useAllProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchAllProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProjectsByCompany = (companyId: number) => {
  return useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => fetchProjectsByCompany(companyId),
    staleTime: 5 * 60 * 1000,
    enabled: !!companyId,
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCapacityData = (companyId?: number) => {
  return useQuery({
    queryKey: ['capacity', companyId],
    queryFn: () => fetchCapacityData(companyId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTaskMetrics = (companyId?: number) => {
  return useQuery({
    queryKey: ['tasks', companyId],
    queryFn: () => fetchTaskMetrics(companyId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useLeavesData = (companyId?: number) => {
  return useQuery({
    queryKey: ['leaves', companyId],
    queryFn: () => fetchLeavesData(companyId),
    staleTime: 5 * 60 * 1000,
  });
};