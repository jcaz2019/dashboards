import React from 'react';
import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import LeavesChartV2 from '../LeavesChartV2';
import SkeletonLoader from '../SkeletonLoader';
import { useDashboardContext } from '../../context/DashboardContext';

const LeavesTabNew: React.FC = () => {
  const { leavesData, isLoadingLeaves, refreshLeaves } = useDashboardContext();
  
  return (
    <Paper elevation={2} sx={{ position: 'relative' }}>
      {/* Indicador de carga */}
      {isLoadingLeaves && (
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
      
      {isLoadingLeaves && leavesData.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <SkeletonLoader type="leaves" />
        </Box>
      ) : leavesData.length === 0 ? (
        <Paper sx={{ p: 2, m: 2, textAlign: 'center', color: 'error.main' }}>
          <Typography variant="h6">
            No se pudieron cargar los datos de licencias
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => refreshLeaves()} 
            sx={{ mt: 2 }}
          >
            Reintentar
          </Button>
        </Paper>
      ) : (
        <LeavesChartV2 leavesData={leavesData} isLoading={false} />
      )}
    </Paper>
  );
};

export default LeavesTabNew;