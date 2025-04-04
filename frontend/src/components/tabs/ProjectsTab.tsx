import React from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { useProjectsByCompany } from '../../hooks/useProjects';
import ProjectsTable from '../ProjectsTable';
import { Project } from '../../types/project';

const ProjectsTab: React.FC = () => {
  // ID de compañía fijo para Projects
  const companyId = 1659;
  
  // Cargar datos de proyectos
  const { 
    data: projects = [] as Project[], 
    isLoading,
    isFetching
  } = useProjectsByCompany(companyId);

  return (
    <Paper elevation={2} sx={{ position: 'relative' }}>
      {/* Indicador de carga */}
      {(isLoading || isFetching) && (
        <LinearProgress 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0 
          }} 
        />
      )}
      
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Projects Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detailed information about all projects
        </Typography>
      </Box>
      
      <ProjectsTable projects={projects} isLoading={isLoading} />
    </Paper>
  );
};

export default ProjectsTab;