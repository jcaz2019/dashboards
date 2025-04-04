import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, Button } from '@mui/material';
import { useAllProjects, useProjectsByCompany, useCompanies } from '../hooks/useProjects';
import ProjectsTable from './ProjectsTable';
import CompanySelector from './CompanySelector';
import LeavesChartV2 from './LeavesChartV2';
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
    if (tabValue === 1) { // Si la pestaña de licencias está activa (nuevo índice después de eliminar tabs)
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
          <Tab label="Leaves" />
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
              Licencias
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Análisis de licencias con filtros y visualización optimizada
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