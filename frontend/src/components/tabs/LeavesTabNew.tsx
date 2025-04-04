import React, { useEffect } from 'react';
import { Box, Paper, Typography, Button, LinearProgress } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LeavesChartV2 from '../LeavesChartV2';
import SkeletonLoader from '../SkeletonLoader';
import { useDashboardContext } from '../../context/DashboardContext';

const LeavesTabNew: React.FC = () => {
  const { 
    leavesData, 
    isLoadingLeaves, 
    refreshLeaves, 
    loadLeaves, 
    leavesLoaded 
  } = useDashboardContext();
  
  // Cargar datos al montar el componente si no están cargados
  useEffect(() => {
    if (!leavesLoaded && !isLoadingLeaves) {
      loadLeaves();
    }
  }, [leavesLoaded, isLoadingLeaves, loadLeaves]);
  
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
      
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Licencias
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de licencias con filtros y visualización optimizada
          </Typography>
        </Box>
        
        {/* Botón de refresco */}
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refreshLeaves()}
          disabled={isLoadingLeaves}
        >
          Refresh
        </Button>
      </Box>
      
      {isLoadingLeaves || (!leavesLoaded && leavesData.length === 0) ? (
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