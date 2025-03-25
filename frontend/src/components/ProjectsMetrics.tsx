import React, { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, IconButton, Tooltip, TextField, Grid, FormControl, InputLabel,
  Select, MenuItem, FormControlLabel, Checkbox, TableSortLabel
} from '@mui/material';
import { Project } from '../types/project';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface ProjectsMetricsProps {
  projects: Project[];
  isLoading: boolean;
}

// Interfaz para datos agrupados por cliente
interface ClientGroup {
  clientName: string;
  projects: Project[];
  totalProjects: number;
  totalHoursDeviation: number;
  totalMargin: number;
  marginPercentage: number;
}

// Interfaz para los filtros
interface ProjectFilters {
  startDateFrom: string;
  startDateTo: string;
  status: string;
  client: string;
  showEmpty: boolean;
}

// Tipo para ordenamiento
type Order = 'asc' | 'desc';

// Interfaz para el estado de ordenamiento
interface SortState {
  field: keyof Project | 'clientName' | 'projectName' | 'projectStatus' | 'startDate' | 'deliveryDate' | 
         'deliveryStatus' | 'hoursDeviation' | 'deviationDays' | 'absoluteMargin' | 'marginPercentage';
  order: Order;
}

const ProjectsMetrics: React.FC<ProjectsMetricsProps> = ({ projects, isLoading }) => {
  // Estado para controlar qué filas están expandidas
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // Estado para los filtros
  const [filters, setFilters] = useState<ProjectFilters>({
    startDateFrom: '',
    startDateTo: '',
    status: 'all',
    client: 'all',
    showEmpty: true
  });
  
  // Estado para ordenamiento (por defecto ordenar por margen porcentual descendente)
  const [sortState, setSortState] = useState<SortState>({
    field: 'marginPercentage',
    order: 'desc'
  });

  // Extraer valores únicos para los filtros
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    projects.forEach(project => {
      if (project.project_status) {
        statuses.add(project.project_status);
      }
    });
    return Array.from(statuses).sort();
  }, [projects]);

  const uniqueClients = useMemo(() => {
    const clients = new Set<string>();
    projects.forEach(project => {
      if (project.client_name) {
        clients.add(project.client_name);
      }
    });
    return Array.from(clients).sort();
  }, [projects]);

  // Función para alternar el estado de expansión de un cliente
  const toggleClientExpansion = useCallback((clientName: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientName)) {
        newSet.delete(clientName);
      } else {
        newSet.add(clientName);
      }
      return newSet;
    });
  }, []);
  
  // Función para manejar cambios en los filtros
  const handleFilterChange = (filterName: keyof ProjectFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Función para manejar el ordenamiento
  const handleSort = (field: SortState['field']) => {
    setSortState(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Función para calcular la desviación en horas
  const calculateHoursDeviation = useCallback((project: Project) => {
    if (project.estimated_hours === null || project.remaining_hours === null) {
      return 0;
    }
    return project.worked_hours - project.estimated_hours;
  }, []);

  // Filtrar proyectos según los criterios de filtro
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      // Filtrar por rango de fechas de inicio
      if (filters.startDateFrom && project.start_date < filters.startDateFrom) {
        return false;
      }
      if (filters.startDateTo && project.start_date > filters.startDateTo) {
        return false;
      }
      
      // Filtrar por estado
      if (filters.status !== 'all' && project.project_status !== filters.status) {
        return false;
      }
      
      // Filtrar por cliente
      if (filters.client !== 'all' && project.client_name !== filters.client) {
        return false;
      }
      
      // Filtrar proyectos sin margen si showEmpty está desactivado
      if (!filters.showEmpty && (project.margin_percentage === null || project.margin_percentage === undefined)) {
        return false;
      }
      
      return true;
    });
  }, [projects, filters]);

  // Agrupar proyectos por cliente y calcular métricas
  const clientGroups = useMemo(() => {
    // Primero, agrupar los proyectos por cliente
    const groupedByClient = filteredProjects.reduce((acc, project) => {
      const clientName = project.client_name;
      if (!acc[clientName]) {
        acc[clientName] = [];
      }
      acc[clientName].push(project);
      return acc;
    }, {} as Record<string, Project[]>);

    // Luego, calcular las métricas para cada grupo
    let groups = Object.entries(groupedByClient).map(([clientName, clientProjects]) => {
      // Ordenar los proyectos dentro de cada cliente según el criterio de ordenamiento
      let sortedProjects = [...clientProjects];
      
      // Ordenar proyectos dentro de cada grupo de cliente
      if (sortState.field === 'projectName') {
        sortedProjects.sort((a, b) => {
          return sortState.order === 'asc' 
            ? a.project_name.localeCompare(b.project_name)
            : b.project_name.localeCompare(a.project_name);
        });
      } else if (sortState.field === 'startDate') {
        sortedProjects.sort((a, b) => {
          const dateA = new Date(a.start_date || '').getTime();
          const dateB = new Date(b.start_date || '').getTime();
          return sortState.order === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else if (sortState.field === 'deliveryDate') {
        sortedProjects.sort((a, b) => {
          const dateA = a.delivery_date ? new Date(a.delivery_date).getTime() : 0;
          const dateB = b.delivery_date ? new Date(b.delivery_date).getTime() : 0;
          return sortState.order === 'asc' ? dateA - dateB : dateB - dateA;
        });
      } else if (sortState.field === 'projectStatus') {
        sortedProjects.sort((a, b) => {
          return sortState.order === 'asc' 
            ? a.project_status.localeCompare(b.project_status)
            : b.project_status.localeCompare(a.project_status);
        });
      } else if (sortState.field === 'deliveryStatus') {
        sortedProjects.sort((a, b) => {
          return sortState.order === 'asc' 
            ? a.delivery_status.localeCompare(b.delivery_status)
            : b.delivery_status.localeCompare(a.delivery_status);
        });
      } else if (sortState.field === 'hoursDeviation') {
        sortedProjects.sort((a, b) => {
          const devA = calculateHoursDeviation(a);
          const devB = calculateHoursDeviation(b);
          return sortState.order === 'asc' ? devA - devB : devB - devA;
        });
      } else if (sortState.field === 'deviationDays') {
        sortedProjects.sort((a, b) => {
          const devA = a.deviation_days ?? 0;
          const devB = b.deviation_days ?? 0;
          return sortState.order === 'asc' ? devA - devB : devB - devA;
        });
      } else if (sortState.field === 'absoluteMargin') {
        sortedProjects.sort((a, b) => {
          const marginA = a.absolute_margin || 0;
          const marginB = b.absolute_margin || 0;
          return sortState.order === 'asc' ? marginA - marginB : marginB - marginA;
        });
      } else if (sortState.field === 'marginPercentage') {
        sortedProjects.sort((a, b) => {
          const marginA = a.margin_percentage ?? -999;
          const marginB = b.margin_percentage ?? -999;
          return sortState.order === 'asc' ? marginA - marginB : marginB - marginA;
        });
      }
      
      // Calcular estadísticas del cliente
      const totalProjects = sortedProjects.length;
      const totalHoursDeviation = sortedProjects.reduce(
        (sum, project) => sum + calculateHoursDeviation(project), 
        0
      );
      const totalMargin = sortedProjects.reduce(
        (sum, project) => sum + (project.absolute_margin || 0), 
        0
      );
      // Calcular el margen porcentual del cliente
      const totalEstimatedIncome = sortedProjects.reduce(
        (sum, project) => sum + (project.estimated_income || 0), 
        0
      );
      const totalCost = sortedProjects.reduce(
        (sum, project) => sum + (project.total_cost || 0),
        0
      );
      
      // Calcular el margen porcentual: Si hay ingresos estimados, usamos esos; de lo contrario, calculamos en base al costo
      const marginPercentage = totalEstimatedIncome > 0 
        ? (totalMargin / totalEstimatedIncome) * 100 
        : (totalCost > 0 ? (totalMargin / totalCost) * 100 : 0);

      return {
        clientName,
        projects: sortedProjects,
        totalProjects,
        totalHoursDeviation,
        totalMargin,
        marginPercentage
      };
    });
    
    // Ordenar los grupos de clientes
    if (sortState.field === 'clientName') {
      groups.sort((a, b) => {
        return sortState.order === 'asc' 
          ? a.clientName.localeCompare(b.clientName)
          : b.clientName.localeCompare(a.clientName);
      });
    } else if (sortState.field === 'marginPercentage') {
      // Ordenar los clientes por margen porcentual
      groups.sort((a, b) => {
        return sortState.order === 'asc' 
          ? a.marginPercentage - b.marginPercentage
          : b.marginPercentage - a.marginPercentage;
      });
    } else if (sortState.field === 'absoluteMargin') {
      // Ordenar los clientes por margen absoluto
      groups.sort((a, b) => {
        return sortState.order === 'asc' 
          ? a.totalMargin - b.totalMargin
          : b.totalMargin - a.totalMargin;
      });
    } else if (sortState.field === 'hoursDeviation') {
      // Ordenar los clientes por desviación de horas
      groups.sort((a, b) => {
        return sortState.order === 'asc' 
          ? a.totalHoursDeviation - b.totalHoursDeviation
          : b.totalHoursDeviation - a.totalHoursDeviation;
      });
    }
    
    return groups;
  }, [filteredProjects, calculateHoursDeviation, sortState]);

  // Funciones utilitarias para mostrar estados con colores
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    if (status === 'on_time' || status === 'early_delivery') {
      return 'success';
    } else if (status === 'in_progress_on_time') {
      return 'info';
    } else if (status === 'late_delivery' || status === 'unfinished_late') {
      return 'error';
    } else {
      return 'default';
    }
  };

  // Formatear fechas sin mostrar "N/A"
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Función para obtener margen porcentual con un valor numérico que se pueda ordenar
  const getMarginPercentage = (project: Project) => {
    return project.margin_percentage !== null && typeof project.margin_percentage === 'number'
      ? project.margin_percentage
      : 0;
  };
  
  // Función para crear encabezados de columna ordenables
  const createSortableColumnHeader = (label: string, field: SortState['field']) => {
    return (
      <TableCell key={field}>
        <TableSortLabel
          active={sortState.field === field}
          direction={sortState.field === field ? sortState.order : 'asc'}
          onClick={() => handleSort(field)}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    );
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

  return (
    <>
      {/* Añadir sección de filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={2}>
          {/* Filtro de cliente */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="client-filter-label">Client</InputLabel>
              <Select
                labelId="client-filter-label"
                value={filters.client}
                label="Client"
                onChange={(e) => handleFilterChange('client', e.target.value)}
              >
                <MenuItem value="all">All Clients</MenuItem>
                {uniqueClients.map(client => (
                  <MenuItem key={client} value={client}>{client}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Filtro de estado */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {uniqueStatuses.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Filtro de rango de fechas para start_date */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date From"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.startDateFrom}
              onChange={(e) => handleFilterChange('startDateFrom', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date To"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.startDateTo}
              onChange={(e) => handleFilterChange('startDateTo', e.target.value)}
            />
          </Grid>
          
          {/* Checkbox para mostrar proyectos sin margen */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.showEmpty}
                  onChange={(e) => handleFilterChange('showEmpty', e.target.checked)}
                  name="showEmpty"
                />
              }
              label="Show projects without margin"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="projects metrics table">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" />
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'clientName'}
                direction={sortState.field === 'clientName' ? sortState.order : 'asc'}
                onClick={() => handleSort('clientName')}
              >
                Client
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'projectName'}
                direction={sortState.field === 'projectName' ? sortState.order : 'asc'}
                onClick={() => handleSort('projectName')}
              >
                Project
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'projectStatus'}
                direction={sortState.field === 'projectStatus' ? sortState.order : 'asc'}
                onClick={() => handleSort('projectStatus')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'startDate'}
                direction={sortState.field === 'startDate' ? sortState.order : 'asc'}
                onClick={() => handleSort('startDate')}
              >
                Start Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'deliveryDate'}
                direction={sortState.field === 'deliveryDate' ? sortState.order : 'asc'}
                onClick={() => handleSort('deliveryDate')}
              >
                End Date
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sortState.field === 'deliveryStatus'}
                direction={sortState.field === 'deliveryStatus' ? sortState.order : 'asc'}
                onClick={() => handleSort('deliveryStatus')}
              >
                Delivery Status
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'hoursDeviation'}
                direction={sortState.field === 'hoursDeviation' ? sortState.order : 'asc'}
                onClick={() => handleSort('hoursDeviation')}
              >
                Hours Deviation
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'deviationDays'}
                direction={sortState.field === 'deviationDays' ? sortState.order : 'asc'}
                onClick={() => handleSort('deviationDays')}
              >
                Deadline Deviation (days)
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'absoluteMargin'}
                direction={sortState.field === 'absoluteMargin' ? sortState.order : 'asc'}
                onClick={() => handleSort('absoluteMargin')}
              >
                Contribution Margin
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={sortState.field === 'marginPercentage'}
                direction={sortState.field === 'marginPercentage' ? sortState.order : 'asc'}
                onClick={() => handleSort('marginPercentage')}
              >
                Margin %
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientGroups.map((clientGroup) => {
            const isExpanded = expandedClients.has(clientGroup.clientName);
            return (
              <React.Fragment key={clientGroup.clientName}>
                {/* Fila de cliente (colapsable) */}
                <TableRow 
                  hover
                  sx={{ 
                    '& > *': { borderBottom: 'unset' },
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <TableCell padding="checkbox">
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={() => toggleClientExpansion(clientGroup.clientName)}
                    >
                      {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {clientGroup.clientName}
                    </Typography>
                  </TableCell>
                  {/* Resumen agrupado del cliente cuando está colapsado */}
                  <TableCell>
                    <Tooltip title="Total Projects">
                      <Chip
                        label={`${clientGroup.totalProjects} projects`}
                        size="small"
                        color="primary"
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={clientGroup.totalHoursDeviation <= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {clientGroup.totalHoursDeviation.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {/* No se muestra la desviación en días para el cliente colapsado */}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      ${clientGroup.totalMargin.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={clientGroup.marginPercentage >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {clientGroup.marginPercentage.toFixed(2)}%
                    </Typography>
                  </TableCell>
                </TableRow>
                
                {/* Filas de proyectos expandidas */}
                {isExpanded && clientGroup.projects.map((project) => {
                  const hoursDeviation = calculateHoursDeviation(project);
                  return (
                    <TableRow 
                      key={project.project_id} 
                      hover
                      sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                    >
                      <TableCell />
                      <TableCell />
                      <TableCell>
                        <Typography variant="body2">{project.project_name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={project.project_status}
                          color={getStatusColor(project.project_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(project.start_date)}</TableCell>
                      <TableCell>{formatDate(project.delivery_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.delivery_status.replace(/_/g, ' ')}
                          color={getDeliveryStatusColor(project.delivery_status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={hoursDeviation <= 0 ? 'success.main' : 'error.main'}
                        >
                          {hoursDeviation.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {project.deviation_days !== null ? (
                          <Typography
                            variant="body2"
                            color={project.deviation_days <= 0 ? 'success.main' : 'error.main'}
                          >
                            {project.deviation_days}
                          </Typography>
                        ) : ''}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ${(project.absolute_margin || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {project.margin_percentage !== null ? (
                          <Typography
                            variant="body2"
                            color={project.margin_percentage >= 0 ? 'success.main' : 'error.main'}
                          >
                            {project.margin_percentage.toFixed(2)}%
                          </Typography>
                        ) : ''}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
    </>
  );
};

export default ProjectsMetrics;
