import React, { useMemo } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CapacityData } from '../types/project';

interface CapacityChartProps {
  capacityData: CapacityData[];
  isLoading: boolean;
}

const CapacityChart: React.FC<CapacityChartProps> = ({ capacityData, isLoading }) => {
  const chartData = useMemo(() => {
    // Agrupar datos por mes
    const groupedByMonth = capacityData.reduce((acc, item) => {
      const month = new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!acc[month]) {
        acc[month] = {
          name: month,
          capacity: 0,
          reserved: 0,
          available: 0
        };
      }
      
      acc[month].capacity += item.capacity;
      acc[month].reserved += item.reserved_hours;
      acc[month].available += Math.max(0, item.capacity - item.reserved_hours);
      
      return acc;
    }, {} as Record<string, { name: string; capacity: number; reserved: number; available: number }>);
    
    // Convertir a array y ordenar por mes
    return Object.values(groupedByMonth).sort((a, b) => {
      const dateA = new Date(a.name);
      const dateB = new Date(b.name);
      return dateA.getTime() - dateB.getTime();
    });
  }, [capacityData]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!capacityData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography variant="body1">No capacity data found.</Typography>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, height: '500px' }}>
      <Typography variant="h6" gutterBottom>
        Capacity Overview by Month
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="capacity" name="Total Capacity" fill="#8884d8" />
          <Bar dataKey="reserved" name="Reserved Hours" fill="#82ca9d" />
          <Bar dataKey="available" name="Available Hours" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CapacityChart; 