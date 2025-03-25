import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, Button } from '@mui/material';
import { useAllProjects, useProjectsByCompany, useCompanies, useCapacityData, useTaskMetrics } from '../hooks/useProjects';
import ProjectsTable from './ProjectsTable';
import CapacityChart from './CapacityChart';
import CompanySelector from './CompanySelector';
import TaskMetricsTable from './TaskMetricsTable';
import CapacityUsageChart from './CapacityUsageChart';
import LeavesChart from './LeavesChart';
import LeavesChartV2 from './LeavesChartV2';
import ProjectStatusDashboard from './ProjectStatusDashboard';
import { fetchLeavesData } from '../services/api';
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
  const [selectedCompany, setSelectedCompany] = useState<number>(1659);
  const [tabValue, setTabValue] = useState(0);
  
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompanies();
  const { data: allProjects = [], isLoading: isLoadingAllProjects } = useAllProjects();
  const { 
    data: companyProjects = [], 
    isLoading: isLoadingCompanyProjects 
  } = useProjectsByCompany(selectedCompany || 0);
  
  const { data: capacityData = [], isLoading: isLoadingCapacity } = useCapacityData(
    selectedCompany !== null ? selectedCompany : undefined
  );
  
  // Añadir el hook para las métricas de tareas
  const { data: taskMetrics = [], isLoading: isLoadingTaskMetrics } = useTaskMetrics(
    selectedCompany !== null ? selectedCompany : undefined
  );

  // Añadir el hook para los datos de licencias
  const [leavesData, setLeavesData] = useState<LeaveData[]>([]);
  const [leavesError, setLeavesError] = useState<string | null>(null);
  const [isLoadingLeaves, setIsLoadingLeaves] = useState<boolean>(false);

  // Siempre usamos los proyectos de la compañía seleccionada, ya que ahora siempre hay una compañía
  const projects = companyProjects;
  const isLoadingProjects = isLoadingCompanyProjects;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Función para cargar los datos de licencias
  const loadLeavesData = async (companyId?: number | null) => {
    setIsLoadingLeaves(true);
    setLeavesError(null);
    
    try {
      // Convertir null a undefined para que coincida con el tipo esperado
      const data = await fetchLeavesData(companyId === null ? undefined : companyId);
      setLeavesData(data);
    } catch (error: any) {
      console.error('Error loading leaves data:', error);
      setLeavesError('No se pudieron cargar los datos de licencias. Por favor, intente nuevamente más tarde.');
      setLeavesData([]);
    } finally {
      setIsLoadingLeaves(false);
    }
  };

  // Cargar datos de licencias cuando se selecciona la pestaña o cambia la compañía
  useEffect(() => {
    if (tabValue === 5 || tabValue === 6) { // Si alguna pestaña de licencias está activa
      loadLeavesData(selectedCompany);
    }
  }, [tabValue, selectedCompany]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Project Dashboard
      </Typography>
      
      <CompanySelector
        companies={companies}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        isLoading={isLoadingCompanies}
      />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Projects" />
          <Tab label="Project Status" />
          <Tab label="Capacity" />
          <Tab label="Task Metrics" />
          <Tab label="Capacity Usage" />
          <Tab label="Leaves" />
          <Tab label="Leaves V2" />
        </Tabs>
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
          <ProjectsTable projects={projects} isLoading={isLoadingProjects} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Status Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Visualización del estado de proyectos y distribución por cliente
            </Typography>
          </Box>
          <ProjectStatusDashboard projects={projects} isLoading={isLoadingProjects} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <CapacityChart capacityData={capacityData} isLoading={isLoadingCapacity} />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Detailed information about tasks from dbt models
            </Typography>
          </Box>
          <TaskMetricsTable tasks={taskMetrics} isLoading={isLoadingTaskMetrics} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={4}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Capacity Usage Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Percentage of gross capacity used per project, grouped by area, position, and user
            </Typography>
          </Box>
          <CapacityUsageChart tasks={taskMetrics} isLoading={isLoadingTaskMetrics} />
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={5}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Licencias y Horas Planificadas
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Análisis de horas planificadas para usuarios con licencias
            </Typography>
          </Box>
          {leavesError ? (
            <Paper sx={{ p: 2, mb: 2, textAlign: 'center', color: 'error.main' }}>
              <Typography variant="h6">{leavesError}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => loadLeavesData(selectedCompany)} 
                sx={{ mt: 2 }}
              >
                Reintentar
              </Button>
            </Paper>
          ) : (
            <LeavesChart leavesData={leavesData} isLoading={isLoadingLeaves} />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={6}>
        <Paper elevation={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Licencias V2 - Visualización Simplificada
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Análisis de licencias con filtros mejorados y visualización optimizada
            </Typography>
          </Box>
          {leavesError ? (
            <Paper sx={{ p: 2, mb: 2, textAlign: 'center', color: 'error.main' }}>
              <Typography variant="h6">{leavesError}</Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => loadLeavesData(selectedCompany)} 
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