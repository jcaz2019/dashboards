import React from 'react';
import { Box, Skeleton, Grid, Paper } from '@mui/material';

interface SkeletonLoaderProps {
  type: 'table' | 'chart' | 'leaves';
  rows?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, rows = 5 }) => {
  if (type === 'table') {
    return (
      <Box sx={{ width: '100%', my: 1 }}>
        {/* Header */}
        <Skeleton variant="rectangular" height={48} sx={{ mb: 1 }} />
        
        {/* Rows */}
        {Array(rows).fill(0).map((_, index) => (
          <Skeleton 
            key={index} 
            variant="rectangular" 
            height={52} 
            sx={{ mb: 1, opacity: 1 - (index * 0.1) }} 
          />
        ))}
      </Box>
    );
  }
  
  if (type === 'chart') {
    return (
      <Box sx={{ width: '100%', my: 1 }}>
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }
  
  if (type === 'leaves') {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {Array(4).fill(0).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
        
        {/* Charts */}
        <Skeleton variant="rectangular" height={300} sx={{ mb: 4 }} />
        
        {/* Calendar */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Skeleton width="40%" height={30} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {Array(3).fill(0).map((_, index) => (
              <Skeleton 
                key={index}
                variant="rectangular" 
                width={300} 
                height={200}
              />
            ))}
          </Box>
        </Paper>
        
        {/* Table */}
        <Paper sx={{ p: 2 }}>
          <Skeleton width="30%" height={30} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={200} />
        </Paper>
      </Box>
    );
  }
  
  return null;
};

export default SkeletonLoader;