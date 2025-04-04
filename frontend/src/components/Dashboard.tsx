import React, { useState, lazy, Suspense } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper, CircularProgress, LinearProgress } from '@mui/material';

// Cargar componentes de pestañas de forma diferida
const ProjectsTab = lazy(() => import('./tabs/ProjectsTab'));
const LeavesTab = lazy(() => import('./tabs/LeavesTab'));

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

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        My Dashboards
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Projects" />
          <Tab label="Leaves" />
        </Tabs>
      </Box>
      
      {/* Usar Suspense para manejar la carga de componentes */}
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }>
        <TabPanel value={tabValue} index={0}>
          {tabValue === 0 && <ProjectsTab />}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {tabValue === 1 && <LeavesTab />}
        </TabPanel>
      </Suspense>
    </Container>
  );
};

export default Dashboard; 