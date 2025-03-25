import React, { useMemo, useState } from 'react';
import { 
  Box, Typography, Paper, Grid, CircularProgress, Stack, Divider, Alert
} from '@mui/material';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, LabelList 
} from 'recharts';
import { Project } from '../types/project';
import DateRangeFilter from './DateRangeFilter';

interface ProjectStatusDashboardProps {
  projects: Project[];
  isLoading: boolean;
}

// Colores para el gráfico de pie
const COLORS = [
  '#0088FE', // Azul para finished
  '#00C49F', // Verde para in_progress
  '#FFBB28', // Amarillo para new
  '#FF8042', // Naranja para suspended
  '#8884d8', '#82ca9d', '#ffc658',
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

// Etiqueta interna simple para segmentos grandes
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Solo mostrar etiquetas para segmentos grandes (mayor a 8%)
  if (percent < 0.08) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      style={{ 
        fontWeight: 'bold', 
        fontSize: '16px',
        textShadow: '0px 0px 3px rgba(0, 0, 0, 0.5)'
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const ProjectStatusDashboard: React.FC<ProjectStatusDashboardProps> = ({ projects, isLoading }) => {
  // Estados para los filtros de fecha de inicio
  const [startDateFrom, setStartDateFrom] = useState<string>('');
  const [startDateTo, setStartDateTo] = useState<string>('');
  
  // Estados para los filtros de fecha de finalización
  const [endDateFrom, setEndDateFrom] = useState<string>('');
  const [endDateTo, setEndDateTo] = useState<string>('');
  
  // Estado para controlar si se aplica el filtro de proyectos finalizados
  const [filterFinishedOnly, setFilterFinishedOnly] = useState<boolean>(false);
  
  // Filtrar proyectos según las fechas seleccionadas
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      let includeProject = true;
      
      // Filtrar por rango de fecha de inicio
      if (startDateFrom || startDateTo) {
        const projectStartDate = new Date(project.start_date);
        
        // Validar que la fecha de inicio del proyecto sea válida
        if (!isNaN(projectStartDate.getTime())) {
          // Aplicar filtro "desde" si está definido
          if (startDateFrom) {
            const filterStartDateFrom = new Date(startDateFrom);
            includeProject = includeProject && projectStartDate >= filterStartDateFrom;
          }
          
          // Aplicar filtro "hasta" si está definido
          if (startDateTo) {
            const filterStartDateTo = new Date(startDateTo);
            // Establecer la hora al final del día para inclusividad
            filterStartDateTo.setHours(23, 59, 59, 999);
            includeProject = includeProject && projectStartDate <= filterStartDateTo;
          }
        } else {
          // Si la fecha de inicio del proyecto no es válida pero estamos filtrando por fecha de inicio,
          // excluir el proyecto
          includeProject = false;
        }
      }
      
      // Filtrar por fecha de finalización (solo aplica si se activa el filtro de proyectos finalizados)
      if (filterFinishedOnly) {
        // Primero verificar si el proyecto está finalizado
        if (project.project_status === 'finished') {
          // Solo aplicar filtros adicionales de fecha si se han seleccionado
          if (endDateFrom || endDateTo) {
            const projectEndDate = project.delivery_date 
              ? new Date(project.delivery_date) 
              : null;
            
            // Si no hay fecha de entrega o es inválida, excluir el proyecto
            if (!projectEndDate || isNaN(projectEndDate.getTime())) {
              includeProject = false;
            } else {
              // Aplicar filtro "desde" si está definido
              if (endDateFrom) {
                const filterEndDateFrom = new Date(endDateFrom);
                includeProject = includeProject && projectEndDate >= filterEndDateFrom;
              }
              
              // Aplicar filtro "hasta" si está definido
              if (endDateTo) {
                const filterEndDateTo = new Date(endDateTo);
                // Establecer la hora al final del día para inclusividad
                filterEndDateTo.setHours(23, 59, 59, 999);
                includeProject = includeProject && projectEndDate <= filterEndDateTo;
              }
            }
          }
        } else {
          // Si el proyecto no está finalizado y estamos filtrando por proyectos finalizados,
          // excluirlo
          includeProject = false;
        }
      }
      
      return includeProject;
    });
  }, [projects, startDateFrom, startDateTo, endDateFrom, endDateTo, filterFinishedOnly]);
  
  // Procesar datos para el gráfico de pie (status)
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    
    filteredProjects.forEach(project => {
      const status = project.project_status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const total = filteredProjects.length;
    
    return Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: status,
        value: count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value); // Ordenar de mayor a menor
  }, [filteredProjects]);
  
  // Procesar datos para el gráfico de barras (clientes)
  const clientData = useMemo(() => {
    const clientCounts: Record<string, number> = {};
    
    filteredProjects.forEach(project => {
      const client = project.client_name;
      clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
    
    return Object.entries(clientCounts)
      .map(([client_name, count]) => ({
        client_name,
        count
      }))
      .sort((a, b) => b.count - a.count); // Ordenar de mayor a menor
  }, [filteredProjects]);
  
  // Función para manejar cambios en los filtros
  const handleToggleFinishedFilter = () => {
    setFilterFinishedOnly(!filterFinishedOnly);
  };
  
  // Construir el mensaje de resumen de filtros
  const getFilterSummaryMessage = () => {
    const parts = [];
    
    if (startDateFrom || startDateTo) {
      let startDatePart = "proyectos iniciados";
      if (startDateFrom) {
        startDatePart += ` desde ${new Date(startDateFrom).toLocaleDateString()}`;
      }
      if (startDateTo) {
        startDatePart += `${startDateFrom ? " y" : ""} hasta ${new Date(startDateTo).toLocaleDateString()}`;
      }
      parts.push(startDatePart);
    }
    
    if (filterFinishedOnly) {
      let endDatePart = "proyectos finalizados";
      if (endDateFrom || endDateTo) {
        if (endDateFrom) {
          endDatePart += ` desde ${new Date(endDateFrom).toLocaleDateString()}`;
        }
        if (endDateTo) {
          endDatePart += `${endDateFrom ? " y" : ""} hasta ${new Date(endDateTo).toLocaleDateString()}`;
        }
      }
      parts.push(endDatePart);
    }
    
    if (parts.length === 0) {
      return null;
    }
    
    return `Mostrando ${filteredProjects.length} de ${projects.length} proyectos (${parts.join("; ")})`;
  };
  
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
  
  const filterSummaryMessage = getFilterSummaryMessage();
  
  return (
    <Box>
      {/* Filtros de fecha */}
      <DateRangeFilter 
        startDateFrom={startDateFrom}
        startDateTo={startDateTo}
        onStartDateFromChange={setStartDateFrom}
        onStartDateToChange={setStartDateTo}
        endDateFrom={endDateFrom}
        endDateTo={endDateTo}
        onEndDateFromChange={setEndDateFrom}
        onEndDateToChange={setEndDateTo}
        isEndDateFilterApplied={filterFinishedOnly}
        onToggleEndDateFilter={handleToggleFinishedFilter}
        title="Filtrar Proyectos por Fechas"
        description="Selecciona un rango de fechas para filtrar los proyectos. Puedes filtrar por fecha de inicio o activar el filtro de fecha de finalización para ver solo proyectos finalizados en un rango específico."
      />
      
      {/* Mensaje de resultados de filtro */}
      {filterSummaryMessage && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography>
            {filterSummaryMessage}
          </Typography>
        </Alert>
      )}
      
      {filteredProjects.length === 0 ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No hay proyectos que cumplan con los criterios de filtrado seleccionados.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Sección superior con gráfico de pie y leyenda detallada */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribución de Proyectos por Status
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={130}
                          innerRadius={65}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={4}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Tarjetas de estadísticas */}
                    <Box sx={{ mb: 2 }}>
                      <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                        <Typography variant="h4" align="center">
                          {filteredProjects.length}
                        </Typography>
                        <Typography variant="subtitle1" align="center">
                          Proyectos {filterFinishedOnly ? 'Finalizados' : 'Totales'}
                        </Typography>
                      </Paper>
                    </Box>
                    
                    {/* Leyenda detallada */}
                    <Grid container spacing={1}>
                      {statusData.map((entry, index) => (
                        <Grid item xs={12} key={index}>
                          <Paper 
                            sx={{ 
                              p: 1.5, 
                              display: 'flex', 
                              alignItems: 'center',
                              borderLeft: 4, 
                              borderColor: COLORS[index % COLORS.length],
                              mb: 1
                            }}
                          >
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="subtitle2">
                                {entry.name.charAt(0).toUpperCase() + entry.name.slice(1).replace(/_/g, ' ')}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {entry.value} ({entry.percentage}%)
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Gráfico de barras de clientes */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Cantidad de Proyectos por Cliente
              </Typography>
              {clientData.length > 15 && (
                <Typography variant="caption" color="text.secondary">
                  * Mostrando los 15 clientes con más proyectos de un total de {clientData.length} clientes
                </Typography>
              )}
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
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
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ProjectStatusDashboard;