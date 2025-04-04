import React from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import ProjectsTable from '../ProjectsTable';
import SkeletonLoader from '../SkeletonLoader';
import { useDashboardContext } from '../../context/DashboardContext';

const ProjectsTabNew: React.FC = () => {
  const { projectsData, isLoadingProjects, refreshProjects } = useDashboardContext();

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
      
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Projects Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detailed information about all projects
        </Typography>
      </Box>
      
      {/* Siempre mostrar algo, incluso durante la carga */}
      {isLoadingProjects ? (
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