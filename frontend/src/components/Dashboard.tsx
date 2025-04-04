import React, { useState, memo, useEffect } from 'react';
import { Container, Box, Typography, Tabs, Tab, LinearProgress } from '@mui/material';
import { DashboardProvider, useDashboardContext } from '../context/DashboardContext';
import ProjectsTabNew from './tabs/ProjectsTabNew';
import LeavesTabNew from './tabs/LeavesTabNew';

// Componente para el contenido de las pestañas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Memoize the tab contents to prevent unnecessary re-renders
const MemoizedProjectsTab = memo(ProjectsTabNew);
const MemoizedLeavesTab = memo(LeavesTabNew);

// Componente para cargar datos perezosamente
const LazyLoadedDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isChangingTab, setIsChangingTab] = useState(false);
  const [changeTimeout, setChangeTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const { 
    loadProjects, 
    loadLeaves, 
    projectsLoaded, 
    leavesLoaded, 
    isLoadingProjects,
    isLoadingLeaves
  } = useDashboardContext();

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (tabValue === 0) {
      // Cargar datos de projectos
      loadProjects();
    } else if (tabValue === 1) {
      // Cargar datos de licencias
      loadLeaves();
    }
  }, [tabValue, loadProjects, loadLeaves]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Mostrar indicador de carga durante el cambio
    setIsChangingTab(true);
    
    // Limpiar temporizador anterior si existe
    if (changeTimeout) {
      clearTimeout(changeTimeout);
    }
    
    // Establece un temporizador corto para evitar parpadeos
    const timeout = setTimeout(() => {
      setTabValue(newValue);
      // Mantener el indicador de carga hasta que los datos estén listos
      const checkLoading = setInterval(() => {
        const isLoading = newValue === 0 ? isLoadingProjects : isLoadingLeaves;
        const isLoaded = newValue === 0 ? projectsLoaded : leavesLoaded;
        
        if (!isLoading && (isLoaded || !navigator.onLine)) {
          setIsChangingTab(false);
          clearInterval(checkLoading);
        }
      }, 100);
      
      // Asegurarse de que el indicador de carga no quede atascado
      setTimeout(() => {
        setIsChangingTab(false);
        clearInterval(checkLoading);
      }, 3000);
    }, 50);
    
    setChangeTimeout(timeout);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Dashboards
      </Typography>
      
      {/* Indicador de carga al cambiar de pestaña */}
      {isChangingTab && (
        <LinearProgress 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 9999 
          }} 
        />
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Projects" />
          <Tab label="Leaves" />
        </Tabs>
      </Box>
      
      {/* Solo renderizar la pestaña activa */}
      {tabValue === 0 && (
        <Box sx={{ p: 3 }}>
          <MemoizedProjectsTab />
        </Box>
      )}
      
      {tabValue === 1 && (
        <Box sx={{ p: 3 }}>
          <MemoizedLeavesTab />
        </Box>
      )}
    </Container>
  );
};

const Dashboard: React.FC = () => {
  return (
    <DashboardProvider>
      <LazyLoadedDashboard />
    </DashboardProvider>
  );
};

export default Dashboard;