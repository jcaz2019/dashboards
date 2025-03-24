import React, { useMemo } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress 
} from '@mui/material';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { Project } from '../types/project';

interface ProjectStatusDashboardProps {
  projects: Project[];
  isLoading: boolean;
}

// Colores para el gráfico de pie
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658',
  '#6a0dad', '#1e90ff', '#32cd32', '#ff4500', '#9370db', '#20b2aa', '#ff6347'
];

// Componente personalizado para el tooltip del gráfico de pie
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle2">
          {payload[0].name}
        </Typography>
        <Typography variant="body2">
          Cantidad: {payload[0].value}
        </Typography>
        <Typography variant="body2">
          Porcentaje: {payload[0].payload.percentage}%
        </Typography>
      </Paper>
    );
  }
  return null;
};

// Componente personalizado para el tooltip del gráfico de barras
const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle2">
          {payload[0].payload.client_name}
        </Typography>
        <Typography variant="body2">
          Cantidad de proyectos: {payload[0].value}
        </Typography>
      </Paper>
    );
  }
  return null;
};

// Componente para mostrar el valor y porcentaje en el gráfico de pie
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Solo mostrar etiquetas para segmentos con porcentaje significativo (mayor a 3%)
  if (percent < 0.03) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      style={{ fontWeight: 'bold', fontSize: '12px' }}
    >
      {`${value} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

const ProjectStatusDashboard: React.FC<ProjectStatusDashboardProps> = ({ projects, isLoading }) => {
  // Procesar datos para el gráfico de pie (status)
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const status = project.project_status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const total = projects.length;
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: status,
        value: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor
  }, [projects]);
  
  // Procesar datos para el gráfico de barras (clientes)
  const clientData = useMemo(() => {
    const clientCounts: Record<string, number> = {};
    
    projects.forEach(project => {
      const client = project.client_name;
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
    
    return Object.entries(clientCounts)
      .map(([client_name, count]) => ({
        client_name,
        count
      }))
      .sort((a, b) => b.count - a.count); // Ordenar de mayor a menor
  }, [projects]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!projects.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography variant="body1">No projects found.</Typography>
      </Box>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {/* Gráfico de pie de status */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 450 }}>
          <Typography variant="h6" gutterBottom>
            Distribución de Proyectos por Status
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={130}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      {/* Gráfico de barras de clientes */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 450 }}>
          <Typography variant="h6" gutterBottom>
            Cantidad de Proyectos por Cliente
          </Typography>
          {clientData.length > 15 && (
            <Typography variant="caption" color="text.secondary">
              * Mostrando los 15 clientes con más proyectos de un total de {clientData.length} clientes
            </Typography>
          )}
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={clientData.slice(0, 15)} // Limitar a los 15 clientes con más proyectos
              layout="vertical"
              margin={{ top: 20, right: 50, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="client_name" 
                type="category" 
                tick={{ fontSize: 11 }}
                width={95}
                tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 18)}...` : value}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar 
                dataKey="count" 
                name="Cantidad de Proyectos" 
                fill="#8884d8"
                barSize={20}
                radius={[0, 4, 4, 0]}
              >
                <LabelList dataKey="count" position="right" />
                {clientData.slice(0, 15).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProjectStatusDashboard;