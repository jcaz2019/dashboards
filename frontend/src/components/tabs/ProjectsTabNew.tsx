import React, { useEffect } from 'react';
import { Box, Paper, Typography, LinearProgress, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ProjectsTable from '../ProjectsTable';
import SkeletonLoader from '../SkeletonLoader';
import { useDashboardContext } from '../../context/DashboardContext';

const ProjectsTabNew: React.FC = () => {
  const { 
    projectsData, 
    isLoadingProjects, 
    refreshProjects, 
    loadProjects, 
    projectsLoaded 
  } = useDashboardContext();

  // Cargar datos al montar el componente si no están cargados
  useEffect(() => {
    if (!projectsLoaded && !isLoadingProjects) {
      loadProjects();
    }
  }, [projectsLoaded, isLoadingProjects, loadProjects]);

  return (
    <Paper elevation={2} sx={{ position: 'relative' }}>
      {/* Indicador de carga */}
      {isLoadingProjects && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0 
          }} 
        />
      )}
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Projects Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detailed information about all projects
          </Typography>
        </Box>
        
        {/* Botón de refresco */}
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refreshProjects()}
          disabled={isLoadingProjects}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Siempre mostrar algo, incluso durante la carga */}
      {isLoadingProjects || !projectsLoaded ? (
        <Box sx={{ px: 2, pb: 2 }}>
          <SkeletonLoader type="table" rows={8} />
        </Box>
      ) : (
        <ProjectsTable projects={projectsData} isLoading={false} />
      )}
    </Paper>
  );
};

export default ProjectsTabNew;