import React, { useState, memo } from 'react';
import { Container, Box, Typography, Tabs, Tab } from '@mui/material';
import { DashboardProvider } from '../context/DashboardContext';
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

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <DashboardProvider>
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
        
        {/* Renderizamos ambas pestañas pero ocultamos la que no está activa */}
        <Box sx={{ display: tabValue === 0 ? 'block' : 'none', p: 3 }}>
          <MemoizedProjectsTab />
        </Box>
        
        <Box sx={{ display: tabValue === 1 ? 'block' : 'none', p: 3 }}>
          <MemoizedLeavesTab />
        </Box>
      </Container>
    </DashboardProvider>
  );
};

export default Dashboard; 