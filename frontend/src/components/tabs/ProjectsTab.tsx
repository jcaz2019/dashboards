import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import SkeletonLoader from '../SkeletonLoader';
import { useProjectsByCompany } from '../../hooks/useProjects';
import ProjectsTable from '../ProjectsTable';
import { Project } from '../../types/project';

const ProjectsTab: React.FC = () => {
  // ID de compañía fijo para Projects
  const companyId = 1659;
  const [isVisible, setIsVisible] = useState(false);
  
  // Retrasar la carga para permitir la renderización de la interfaz primero
  useEffect(() => {
    // Usar setTimeout para permitir que la UI se pinte antes de la carga pesada
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Cargar datos de proyectos
  const { 
    data: projects = [] as Project[], 
    isLoading,
    isFetching
  } = useProjectsByCompany(companyId, {
    // Solo habilitar la carga después de que el componente sea visible
    enabled: isVisible,
    suspense: false
  });

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
      
      {/* Renderizar esqueleto primero para mejor percepción de velocidad */}
      {!isVisible || isLoading ? (
        <Box sx={{ px: 2, pb: 2 }}>
          <SkeletonLoader type="table" rows={8} />
        </Box>
      ) : (
        <ProjectsTable projects={projects} isLoading={false} />
      )}
    </Paper>
  );
};

export default ProjectsTab;