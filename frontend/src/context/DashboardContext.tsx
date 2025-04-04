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
  loadProjects: () => Promise<void>;
  loadLeaves: () => Promise<void>;
  projectsLoaded: boolean;
  leavesLoaded: boolean;
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
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState(false);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [leavesLoaded, setLeavesLoaded] = useState(false);
  
  // Load projects data only when the tab is activated
  const loadProjects = async () => {
    // Skip if already loaded or loading
    if (projectsLoaded || isLoadingProjects) return;
    
    try {
      setIsLoadingProjects(true);
      console.time('Load Projects');
      const data = await fetchProjectsByCompany(PROJECTS_COMPANY_ID);
      setProjectsData(data);
      setProjectsLoaded(true);
      console.timeEnd('Load Projects');
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  // Load leaves data only when the tab is activated
  const loadLeaves = async () => {
    // Skip if already loaded or loading
    if (leavesLoaded || isLoadingLeaves) return;
    
    try {
      setIsLoadingLeaves(true);
      console.time('Load Leaves');
      const data = await fetchLeavesData(LEAVES_COMPANY_ID);
      setLeavesData(data);
      setLeavesLoaded(true);
      console.timeEnd('Load Leaves');
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setIsLoadingLeaves(false);
    }
  };
  
  // No initial data loading - we'll load it when the tab is activated
  
  // Refresh functions
  const refreshProjects = async () => {
    try {
      setIsLoadingProjects(true);
      console.time('Refresh Projects');
      const data = await fetchProjectsByCompany(PROJECTS_COMPANY_ID);
      setProjectsData(data);
      setProjectsLoaded(true);
      console.timeEnd('Refresh Projects');
    } catch (error) {
      console.error('Error refreshing projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  const refreshLeaves = async () => {
    try {
      setIsLoadingLeaves(true);
      console.time('Refresh Leaves');
      const data = await fetchLeavesData(LEAVES_COMPANY_ID);
      setLeavesData(data);
      setLeavesLoaded(true);
      console.timeEnd('Refresh Leaves');
    } catch (error) {
      console.error('Error refreshing leaves:', error);
    } finally {
      setIsLoadingLeaves(false);
    }
  };
  
  // Context value with lazy loading functions
  const value: DashboardContextType = {
    projectsData,
    leavesData,
    isLoadingProjects,
    isLoadingLeaves,
    refreshProjects,
    refreshLeaves,
    loadProjects,
    loadLeaves,
    projectsLoaded,
    leavesLoaded
  };
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
