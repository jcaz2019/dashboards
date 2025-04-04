import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, LeaveData } from '../types/project';
import { fetchProjectsByCompany, fetchLeavesData } from '../services/api';

interface DashboardContextType {
  projectsData: Project[];
  leavesData: LeaveData[];
  isLoadingProjects: boolean;
  isLoadingLeaves: boolean;
  refreshProjects: () => Promise<void>;
  refreshLeaves: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  // Constants for fixed company IDs
  const PROJECTS_COMPANY_ID = 1659;
  const LEAVES_COMPANY_ID = 4195;
  
  // State
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [leavesData, setLeavesData] = useState<LeaveData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(true);
  
  // Load projects data
  const loadProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const data = await fetchProjectsByCompany(PROJECTS_COMPANY_ID);
      setProjectsData(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  // Load leaves data
  const loadLeaves = async () => {
    try {
      setIsLoadingLeaves(true);
      const data = await fetchLeavesData(LEAVES_COMPANY_ID);
      setLeavesData(data);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setIsLoadingLeaves(false);
    }
  };
  
  // Initialize data loading
  useEffect(() => {
    loadProjects();
    
    // Load leaves data with a slight delay to prioritize projects loading first
    const leavesTimer = setTimeout(() => {
      loadLeaves();
    }, 1000);
    
    return () => clearTimeout(leavesTimer);
  }, []);
  
  // Refresh functions
  const refreshProjects = async () => {
    await loadProjects();
  };
  
  const refreshLeaves = async () => {
    await loadLeaves();
  };
  
  // Context value
  const value: DashboardContextType = {
    projectsData,
    leavesData,
    isLoadingProjects,
    isLoadingLeaves,
    refreshProjects,
    refreshLeaves
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
