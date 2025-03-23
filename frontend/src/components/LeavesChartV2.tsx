import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, CircularProgress, Paper, Grid, FormControl,
  InputLabel, Select, MenuItem, SelectChangeEvent, Divider, Chip
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LabelList
} from 'recharts';
import { LeaveData } from '../types/project';

interface LeavesChartV2Props {
  leavesData: LeaveData[];
  isLoading: boolean;
}

// Función para parsear el string de licencias y obtener los días
const parseLeaveDays = (licenciasStr: string): number[] => {
  if (!licenciasStr || licenciasStr === '') return [];
  
  try {
    // Dividir por espacios para manejar múltiples rangos como "[2] [7-15] [20-25]"
    const ranges = licenciasStr.split(/\s+/);
    
    // Procesar cada rango
    return ranges.flatMap(range => {
      // Eliminar corchetes
      const cleanRange = range.replace(/[\[\]]/g, '');
      
      // Si está vacío después de limpiar, ignorar
      if (!cleanRange) return [];
      
      // Si contiene un guion, es un rango (ej: "2-15")
      if (cleanRange.includes('-')) {
        const [start, end] = cleanRange.split('-').map(d => parseInt(d.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          // Crear un array con todos los días en el rango
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
      }
      
      // Si no contiene guion, es un día individual
      const num = parseInt(cleanRange.trim());
      return !isNaN(num) ? [num] : [];
    });
  } catch (error) {
    console.error('Error parsing leave days:', error);
    return [];
  }
};

// Función auxiliar segura para reducir
const safeReduce = (data: any[], valueGetter: (item: any) => number, initialValue = 0): number => {
  if (!data || data.length === 0) return initialValue;
  return data.reduce((sum, item) => {
    const value = valueGetter(item);
    return sum + (typeof value === 'number' && !isNaN(value) ? value : 0);
  }, initialValue);
};

// Formatear números de manera segura
const safeNumberFormatter = (value: any) => {
  if (value === undefined || value === null) return "0";
  
  const num = Number(value);
  
  if (!isNaN(num)) {
    if (Number.isInteger(num)) {
      return num.toString();
    }
    return num.toFixed(1);
  }
  
  return "0";
};

const LeavesChartV2: React.FC<LeavesChartV2Props> = ({ leavesData, isLoading }) => {
  // Estados para los filtros
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  // Extraer meses, usuarios y proyectos únicos para los filtros
  const { months, users, projects } = useMemo(() => {
    // Usuarios que tienen licencias
    const usersWithLeaves = leavesData
      .filter(item => {
        const leaveDays = parseLeaveDays(item.licencias);
        return leaveDays.length > 0; // Solo incluir usuarios con días de licencia
      })
      .map(item => ({ 
        id: item.user_id, 
        name: item.user_name 
      }));
    
    const uniqueUsers = Array.from(
      new Map(usersWithLeaves.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    // Proyectos con usuarios que tienen licencias
    const projectsWithLeaves = leavesData
      .filter(item => {
        const leaveDays = parseLeaveDays(item.licencias);
        return leaveDays.length > 0; // Solo incluir registros con licencias
      })
      .map(item => ({
        id: item.project_id,
        name: item.project_name || 'Sin proyecto'
      }));
    
    const uniqueProjects = Array.from(
      new Map(projectsWithLeaves.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
    
    // Meses
    const monthsFromData = leavesData.map(item => {
      const month = item.month;
      
      // Si ya tiene formato YYYY-MM, usarlo directamente
      if (/^\d{4}-\d{2}$/.test(month)) {
        return month;
      }
      
      // Si es una fecha ISO completa, extraer año y mes
      if (month && month.includes('T')) {
        try {
          const date = new Date(month);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const monthNum = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${monthNum}`;
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      
      return null; // Si no se puede extraer un mes válido
    }).filter(Boolean) as string[];
    
    const uniqueMonths = Array.from(new Set(monthsFromData)).sort();
    
    return { 
      months: uniqueMonths, 
      users: uniqueUsers,
      projects: uniqueProjects
    };
  }, [leavesData]);
  
  // Función para formatear el mes de manera más legible
  const formatMonth = (monthStr: string) => {
    try {
      if (monthStr.includes('T')) {
        const date = new Date(monthStr);
        if (!isNaN(date.getTime())) {
          const month = date.toLocaleDateString('es-ES', { month: 'short' });
          const shortMonth = month.charAt(0).toUpperCase() + month.slice(1, 3);
          return `${shortMonth}-${date.getFullYear()}`;
        }
      }
      
      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        const date = new Date(monthStr + '-01');
        if (!isNaN(date.getTime())) {
          const month = date.toLocaleDateString('es-ES', { month: 'short' });
          const shortMonth = month.charAt(0).toUpperCase() + month.slice(1, 3);
          return `${shortMonth}-${date.getFullYear()}`;
        }
      }
      
      return monthStr;
    } catch (error) {
      console.error('Error formatting month:', error);
      return monthStr;
    }
  };
  
  // Manejadores para los filtros
  const handleUserChange = (event: SelectChangeEvent) => {
    setSelectedUser(event.target.value);
    
    // Si se selecciona un usuario específico, filtrar los proyectos disponibles
    if (event.target.value !== 'all') {
      // Restablecer la selección de proyecto si no está disponible para este usuario
      if (selectedProject !== 'all') {
        const userProjects = leavesData
          .filter(item => item.user_id.toString() === event.target.value)
          .map(item => item.project_id);
        
        if (!userProjects.includes(parseInt(selectedProject))) {
          setSelectedProject('all');
        }
      }
    }
  };
  
  const handleProjectChange = (event: SelectChangeEvent) => {
    setSelectedProject(event.target.value);
    
    // Si se selecciona un proyecto específico, filtrar los usuarios disponibles
    if (event.target.value !== 'all') {
      // Restablecer la selección de usuario si no está disponible para este proyecto
      if (selectedUser !== 'all') {
        const projectUsers = leavesData
          .filter(item => item.project_id.toString() === event.target.value)
          .map(item => item.user_id.toString());
        
        if (!projectUsers.includes(selectedUser)) {
          setSelectedUser('all');
        }
      }
    }
  };
  
  // Manejadores para los filtros de rango de meses
  const handleStartMonthChange = (event: SelectChangeEvent) => {
    setStartMonth(event.target.value);
  };
  
  const handleEndMonthChange = (event: SelectChangeEvent) => {
    setEndMonth(event.target.value);
  };
  
  // Inicializar los filtros cuando cambian los meses disponibles
  useEffect(() => {
    if (months.length > 0) {
      if (!startMonth || !months.includes(startMonth)) {
        const firstMonth = months[0];
        setStartMonth(firstMonth);
      }
      
      if (!endMonth || !months.includes(endMonth)) {
        const lastMonth = months[months.length - 1];
        setEndMonth(lastMonth);
      }
    }
  }, [months]);
  
  // Filtrar proyectos disponibles basados en el usuario seleccionado
  const availableProjects = useMemo(() => {
    if (selectedUser === 'all') {
      return projects;
    }
    
    // Obtener los proyectos del usuario seleccionado
    const userProjects = leavesData
      .filter(item => item.user_id.toString() === selectedUser)
      .map(item => ({
        id: item.project_id,
        name: item.project_name || 'Sin proyecto'
      }));
    
    // Eliminar duplicados
    return Array.from(
      new Map(userProjects.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [leavesData, selectedUser, projects]);
  
  // Filtrar usuarios disponibles basados en el proyecto seleccionado
  const availableUsers = useMemo(() => {
    if (selectedProject === 'all') {
      return users;
    }
    
    // Obtener los usuarios del proyecto seleccionado
    const projectUsers = leavesData
      .filter(item => item.project_id.toString() === selectedProject)
      .map(item => ({
        id: item.user_id,
        name: item.user_name
      }));
    
    // Eliminar duplicados
    return Array.from(
      new Map(projectUsers.map(item => [item.id, item])).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [leavesData, selectedProject, users]);
  
  // Filtrar datos según las selecciones
  const filteredData = useMemo(() => {
    let filtered = leavesData;
    
    // Aplicar filtro de usuario
    if (selectedUser !== 'all') {
      filtered = filtered.filter(item => item.user_id.toString() === selectedUser);
    }
    
    // Aplicar filtro de proyecto
    if (selectedProject !== 'all') {
      filtered = filtered.filter(item => item.project_id.toString() === selectedProject);
    }
    
    // Filtrar por rango de meses
    filtered = filtered.filter(item => {
      // Extraer el mes en formato YYYY-MM
      let itemMonth = item.month;
      
      // Si el item.month está en formato ISO
      if (item.month && item.month.includes('T')) {
        try {
          const date = new Date(item.month);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const monthNum = String(date.getMonth() + 1).padStart(2, '0');
            itemMonth = `${year}-${monthNum}`;
          }
        } catch (e) {
          console.error('Error parsing date for range filtering:', e);
        }
      }
      
      const isInRange = (!startMonth || itemMonth >= startMonth) && 
                         (!endMonth || itemMonth <= endMonth);
      return isInRange;
    });
    
    // Filtrar para incluir solo usuarios con licencias
    filtered = filtered.filter(item => {
      const leaveDays = parseLeaveDays(item.licencias);
      return leaveDays.length > 0;
    });
    
    return filtered;
  }, [leavesData, selectedUser, selectedProject, startMonth, endMonth]);
  
  // Procesar datos para los totalizadores
  const summaryData = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalLeaveDays: 0,
        totalReservedHours: 0,
        totalUsers: 0,
        totalProjects: 0
      };
    }
    
    // Mapa para evitar contar días duplicados por usuario/mes
    const userMonthDaysMap = new Map<string, Set<number>>();
    
    // Procesar los días de licencia
    filteredData.forEach(item => {
      const key = `${item.user_id}-${item.month}`;
      const leaveDays = parseLeaveDays(item.licencias);
      
      if (!userMonthDaysMap.has(key)) {
        userMonthDaysMap.set(key, new Set<number>());
      }
      
      const daysSet = userMonthDaysMap.get(key)!;
      leaveDays.forEach(day => daysSet.add(day));
    });
    
    // Calcular total de días de licencia
    let totalLeaveDays = 0;
    userMonthDaysMap.forEach(daysSet => {
      totalLeaveDays += daysSet.size;
    });
    
    // Calcular total de horas reservadas
    const totalReservedHours = filteredData.reduce((sum, item) => {
      return sum + (Number(item.reserved_hours) || 0);
    }, 0);
    
    // Usuarios únicos
    const uniqueUsers = new Set(filteredData.map(item => item.user_id));
    
    // Proyectos únicos
    const uniqueProjects = new Set(filteredData.map(item => item.project_id));
    
    return {
      totalLeaveDays,
      totalReservedHours,
      totalUsers: uniqueUsers.size,
      totalProjects: uniqueProjects.size
    };
  }, [filteredData]);
  
  // Procesar datos para el gráfico de licencias por usuario por mes
  const userMonthLeavesData = useMemo(() => {
    // Agrupar por usuario y mes
    const userMonthMap = new Map<string, Map<string, {
      leaveDays: Set<number>;
      reservedHours: number;
    }>>();
    
    // Preparar los datos
    filteredData.forEach(item => {
      const userId = item.user_id.toString();
      const userName = item.user_name;
      const month = item.month;
      const leaveDays = parseLeaveDays(item.licencias);
      const reservedHours = Number(item.reserved_hours) || 0;
      
      if (leaveDays.length === 0) return;
      
      // Inicializar mapa para el usuario si no existe
      if (!userMonthMap.has(userName)) {
        userMonthMap.set(userName, new Map());
      }
      
      // Obtener el mapa de meses para este usuario
      const monthMap = userMonthMap.get(userName)!;
      
      // Inicializar datos para este mes si no existe
      if (!monthMap.has(month)) {
        monthMap.set(month, {
          leaveDays: new Set<number>(),
          reservedHours: 0
        });
      }
      
      // Actualizar datos para este usuario/mes
      const monthData = monthMap.get(month)!;
      leaveDays.forEach(day => monthData.leaveDays.add(day));
      monthData.reservedHours += reservedHours;
    });
    
    // Convertir a formato para el gráfico
    const result: {
      user: string;
      month: string;
      formattedMonth: string;
      leaveDays: number;
      reservedHours: number;
    }[] = [];
    
    // Convertir mapa anidado a array plano
    userMonthMap.forEach((monthMap, userName) => {
      monthMap.forEach((data, month) => {
        let monthFormatted = month;
        
        // Formatear el mes si es posible
        if (month.includes('T')) {
          try {
            const date = new Date(month);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const monthNum = String(date.getMonth() + 1).padStart(2, '0');
              monthFormatted = `${year}-${monthNum}`;
            }
          } catch (e) {
            console.error('Error formatting month:', e);
          }
        }
        
        result.push({
          user: userName,
          month: monthFormatted,
          formattedMonth: formatMonth(month),
          leaveDays: data.leaveDays.size,
          reservedHours: data.reservedHours
        });
      });
    });
    
    // Ordenar por usuario y mes
    return result.sort((a, b) => {
      if (a.user !== b.user) {
        return a.user.localeCompare(b.user);
      }
      return a.month.localeCompare(b.month);
    });
  }, [filteredData]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!leavesData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography variant="body1">No se encontraron datos de licencias.</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2}>
          {/* Filtro de rango de meses */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="start-month-label">Mes de inicio</InputLabel>
              <Select
                labelId="start-month-label"
                value={startMonth}
                label="Mes de inicio"
                onChange={handleStartMonthChange}
                disabled={months.length === 0}
              >
                {months.length > 0 ? (
                  months.map(month => (
                    <MenuItem key={month} value={month}>
                      {formatMonth(month)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No hay meses disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="end-month-label">Mes de fin</InputLabel>
              <Select
                labelId="end-month-label"
                value={endMonth}
                label="Mes de fin"
                onChange={handleEndMonthChange}
                disabled={months.length === 0}
              >
                {months.length > 0 ? (
                  months.map(month => (
                    <MenuItem key={month} value={month}>
                      {formatMonth(month)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No hay meses disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Filtro de usuarios */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="user-select-label">Usuario</InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUser}
                label="Usuario"
                onChange={handleUserChange}
              >
                <MenuItem value="all">Todos los usuarios</MenuItem>
                {availableUsers.map(user => (
                  <MenuItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Filtro de proyectos */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="project-select-label">Proyecto</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject}
                label="Proyecto"
                onChange={handleProjectChange}
              >
                <MenuItem value="all">Todos los proyectos</MenuItem>
                {availableProjects.map(project => (
                  <MenuItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Indicadores de filtros activos */}
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {startMonth && (
            <Chip 
              label={`Desde: ${formatMonth(startMonth)}`} 
              color="primary" 
              variant="outlined" 
            />
          )}
          {endMonth && (
            <Chip 
              label={`Hasta: ${formatMonth(endMonth)}`} 
              color="primary" 
              variant="outlined" 
            />
          )}
          {selectedUser !== 'all' && (
            <Chip 
              label={`Usuario: ${users.find(u => u.id.toString() === selectedUser)?.name || selectedUser}`} 
              color="secondary" 
              variant="outlined" 
              onDelete={() => setSelectedUser('all')}
            />
          )}
          {selectedProject !== 'all' && (
            <Chip 
              label={`Proyecto: ${projects.find(p => p.id.toString() === selectedProject)?.name || selectedProject}`} 
              color="success" 
              variant="outlined" 
              onDelete={() => setSelectedProject('all')}
            />
          )}
        </Box>
      </Paper>
      
      {/* Tarjetas totalizadoras */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white', height: '100%' }}>
            <Typography variant="h4">
              {summaryData.totalLeaveDays}
            </Typography>
            <Typography variant="body2">Días de licencia</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white', height: '100%' }}>
            <Typography variant="h4">
              {safeNumberFormatter(summaryData.totalReservedHours)}
            </Typography>
            <Typography variant="body2">Horas planificadas</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white', height: '100%' }}>
            <Typography variant="h4">
              {summaryData.totalUsers}
            </Typography>
            <Typography variant="body2">Usuarios con licencias</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white', height: '100%' }}>
            <Typography variant="h4">
              {summaryData.totalProjects}
            </Typography>
            <Typography variant="body2">Proyectos afectados</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Licencias por usuario por mes con desplegables */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Licencias por usuario por mes
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Detalle de días de licencia y horas planificadas por usuario en cada mes
        </Typography>
        
        {userMonthLeavesData.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No hay datos de licencias para mostrar con los filtros seleccionados</Typography>
          </Box>
        ) : (
          // Agrupar por usuario
          Object.values(
            userMonthLeavesData.reduce((acc: Record<string, any[]>, item) => {
              if (!acc[item.user]) {
                acc[item.user] = [];
              }
              acc[item.user].push(item);
              return acc;
            }, {})
          ).map((userItems, userIndex) => (
            <Box key={userIndex} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {userItems[0].user}
              </Typography>
              
              <Grid container spacing={2}>
                {userItems.map((item, itemIndex) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={itemIndex}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        bgcolor: item.leaveDays > 0 ? 'rgba(136, 132, 216, 0.1)' : 'white'
                      }}
                      elevation={1}
                    >
                      <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                        {item.formattedMonth}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Días de licencia:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {item.leaveDays}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Horas planificadas:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {safeNumberFormatter(item.reservedHours)}
                        </Typography>
                      </Box>
                      
                      {item.reservedHours > 0 && item.leaveDays > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Hrs/día:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {safeNumberFormatter(item.reservedHours / item.leaveDays)}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              
              {userIndex < Object.keys(userMonthLeavesData.reduce((acc: Record<string, any[]>, item) => {
                if (!acc[item.user]) {
                  acc[item.user] = [];
                }
                acc[item.user].push(item);
                return acc;
              }, {})).length - 1 && (
                <Divider sx={{ my: 2 }} />
              )}
            </Box>
          ))
        )}
      </Paper>
    </Box>
  );
};

export default LeavesChartV2;