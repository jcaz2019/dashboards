import React, { useState, lazy, Suspense } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, Button, CircularProgress, LinearProgress } from '@mui/material';
import { useProjectsByCompany, useLeavesData } from '../hooks/useProjects';
import ProjectsTable from './ProjectsTable';
import LeavesChartV2 from './LeavesChartV2';
import { LeaveData } from '../types/project';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // IDs de compañía
  const defaultCompanyId = 1659;
  const leavesCompanyId = 4195;
  
  // Cargar datos de proyectos solo si estamos en la pestaña "Projects"
  const { 
    data: companyProjects = [], 
    isLoading: isLoadingCompanyProjects 
  } = useProjectsByCompany(defaultCompanyId, {
    enabled: tabValue === 0, // Solo cargar si estamos en la primera pestaña
    keepPreviousData: true, // Mantener datos anteriores mientras se cargan nuevos
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  });
  
  // Usar el hook para cargar datos de licencias solo si estamos en la pestaña "Leaves"
  const {
    data: leavesData = [],
    isLoading: isLoadingLeaves,
    error: leavesError,
    refetch: refetchLeaves
  } = useLeavesData(leavesCompanyId, {
    enabled: tabValue === 1, // Solo cargar si estamos en la segunda pestaña
    keepPreviousData: true, // Mantener datos anteriores mientras se cargan nuevos
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Dashboards
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Projects" />
          <Tab label="Leaves" />
        </Tabs>
        {/* Indicador de carga en pestañas */}
        {((tabValue === 0 && isLoadingCompanyProjects) || 
          (tabValue === 1 && isLoadingLeaves)) && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: '3px' 
          }}>
            <LinearProgress color="secondary" />
          </Box>
        )}
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Projects Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Detailed information about all projects
            </Typography>
          </Box>
          <ProjectsTable projects={companyProjects} isLoading={isLoadingCompanyProjects} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Licencias
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Análisis de licencias con filtros y visualización optimizada
            </Typography>
          </Box>
          {leavesError ? (
            <Paper sx={{ p: 2, mb: 2, textAlign: 'center', color: 'error.main' }}>
              <Typography variant="h6">
                Error al cargar datos de licencias
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => refetchLeaves()} 
                sx={{ mt: 2 }}
              >
                Reintentar
              </Button>
            </Paper>
          ) : (
            <LeavesChartV2 leavesData={leavesData} isLoading={isLoadingLeaves} />
          )}
        </Paper>
      </TabPanel>
    </Container>
  );
};

export default Dashboard; 