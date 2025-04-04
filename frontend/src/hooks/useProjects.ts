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
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!companyId,
    refetchOnWindowFocus: false, // No recargar al enfocar la ventana
    refetchOnMount: false, // No recargar al montar el componente si hay datos en caché
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
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
    refetchOnWindowFocus: false, // No recargar al enfocar la ventana
    refetchOnMount: false, // No recargar al montar el componente si hay datos en caché
    ...options
  });
};