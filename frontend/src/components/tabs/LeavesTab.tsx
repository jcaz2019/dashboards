import React from 'react';
import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import { useLeavesData } from '../../hooks/useProjects';
import LeavesChartV2 from '../LeavesChartV2';
import { LeaveData } from '../../types/project';

const LeavesTab: React.FC = () => {
  // ID de compañía fijo para Leaves
  const companyId = 4195;
  
  // Cargar datos de licencias
  const {
    data: leavesData = [] as LeaveData[],
    isLoading,
    isFetching,
    error,
    refetch
  } = useLeavesData(companyId);

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
          Licencias
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Análisis de licencias con filtros y visualización optimizada
        </Typography>
      </Box>
      
      {error ? (
        <Paper sx={{ p: 2, m: 2, textAlign: 'center', color: 'error.main' }}>
          <Typography variant="h6">
            Error al cargar datos de licencias
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => refetch()} 
            sx={{ mt: 2 }}
          >
            Reintentar
          </Button>
        </Paper>
      ) : (
        <LeavesChartV2 leavesData={leavesData} isLoading={isLoading} />
      )}
    </Paper>
  );
};

export default LeavesTab;