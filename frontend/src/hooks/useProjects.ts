import { useQuery } from '@tanstack/react-query';
import { fetchAllProjects, fetchProjectsByCompany, fetchCompanies, fetchLeavesData } from '../services/api';

export const useAllProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchAllProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProjectsByCompany = (companyId: number, options = {}) => {
  return useQuery({
    queryKey: ['projects', companyId],
    queryFn: () => fetchProjectsByCompany(companyId),
    staleTime: 5 * 60 * 1000,
    enabled: !!companyId,
    ...options
  });
};

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLeavesData = (companyId?: number, options = {}) => {
  return useQuery({
    queryKey: ['leaves', companyId],
    queryFn: () => fetchLeavesData(companyId),
    staleTime: 5 * 60 * 1000,
    ...options
  });
};