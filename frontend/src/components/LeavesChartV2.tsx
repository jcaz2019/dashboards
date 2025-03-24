import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, CircularProgress, Paper, Grid, FormControl,
  InputLabel, Select, MenuItem, SelectChangeEvent, Divider, Chip, Button, Collapse, TableContainer, Table, TableHead, TableBody, TableRow, TableCell
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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
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
  
  // Función para alternar la expansión de las tarjetas
  const toggleCardExpansion = (user: string, month: string) => {
    const key = `${user}-${month}`;
    const newExpandedCards = new Set(expandedCards);
    
    if (newExpandedCards.has(key)) {
      newExpandedCards.delete(key);
    } else {
      newExpandedCards.add(key);
    }
    
    setExpandedCards(newExpandedCards);
  };
  
  // Componente para mostrar un calendario visual de licencias
  const LeavesCalendar = ({ filteredData }: { filteredData: LeaveData[] }) => {
    // Estado para controlar qué filas están expandidas
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    // Estado para controlar qué usuarios tienen detalles de proyectos expandidos
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    
    // Función para alternar la expansión de una fila
    const toggleRowExpansion = (userId: string, month: string) => {
      const key = `${userId}-${month}`;
      const newExpandedRows = new Set(expandedRows);
      
      if (newExpandedRows.has(key)) {
        newExpandedRows.delete(key);
      } else {
        newExpandedRows.add(key);
      }
      
      setExpandedRows(newExpandedRows);
    };
    
    // Función para alternar la expansión de los detalles de proyectos
    const toggleProjectsExpansion = (userId: string, month: string, event: React.MouseEvent) => {
      event.stopPropagation(); // Evitar que se propague al clic de la fila
      
      const key = `${userId}-${month}-projects`;
      const newExpandedProjects = new Set(expandedProjects);
      
      if (newExpandedProjects.has(key)) {
        newExpandedProjects.delete(key);
      } else {
        newExpandedProjects.add(key);
      }
      
      setExpandedProjects(newExpandedProjects);
    };
    
    // Función para expandir/colapsar todos los usuarios de un mes
    const toggleAllUsersInMonth = (month: string, users: UserData[]) => {
      const newExpandedRows = new Set(expandedRows);
      
      // Verificar si todos los usuarios del mes están expandidos
      const allExpanded = users.every(user => 
        newExpandedRows.has(`${user.userId}-${month}`)
      );
      
      // Si todos están expandidos, colapsar todos; de lo contrario, expandir todos
      users.forEach(user => {
        const key = `${user.userId}-${month}`;
        if (allExpanded) {
          newExpandedRows.delete(key);
        } else {
          newExpandedRows.add(key);
        }
      });
      
      setExpandedRows(newExpandedRows);
    };
    
    // Función para expandir/colapsar todos los proyectos de un mes
    const toggleAllProjectsInMonth = (month: string, users: UserData[]) => {
      const newExpandedProjects = new Set(expandedProjects);
      
      // Verificar si todos los proyectos del mes están expandidos
      const allProjectsExpanded = users.every(user => 
        newExpandedProjects.has(`${user.userId}-${month}-projects`)
      );
      
      // Si todos están expandidos, colapsar todos; de lo contrario, expandir todos
      users.forEach(user => {
        const key = `${user.userId}-${month}-projects`;
        if (allProjectsExpanded) {
          newExpandedProjects.delete(key);
        } else {
          newExpandedProjects.add(key);
        }
      });
      
      setExpandedProjects(newExpandedProjects);
    };
    
    // Agrupar datos por mes y usuario
    const calendarData = useMemo(() => {
      // Definir tipos explícitos para los mapas
      const monthUserMap = new Map<string, Map<string, {
        userId: string | number,
        userName: string,
        days: Set<number>,
        ranges: Set<string>, // Usar Set para evitar duplicados
        projects: Map<string, number> // Mapa de proyectos a horas reservadas
      }>>();
      
      // Primero, crear un mapa para rastrear las horas ya contabilizadas por usuario/proyecto/mes
      const processedHours = new Map<string, Map<string, Map<string, boolean>>>();
      
      filteredData.forEach(item => {
        const month = item.month;
        const userName = item.user_name;
        const userId = item.user_id.toString();
        const leaveDays = parseLeaveDays(item.licencias);
        const ranges = item.licencias; // Guardar los rangos originales
        const projectName = item.project_name;
        const projectId = item.project_id.toString();
        const reservedHours = Number(item.reserved_hours) || 0;
        
        if (leaveDays.length === 0) return;
        
        // Inicializar el mapa de procesamiento si es necesario
        if (!processedHours.has(userId)) {
          processedHours.set(userId, new Map());
        }
        const userProcessed = processedHours.get(userId)!;
        
        if (!userProcessed.has(month)) {
          userProcessed.set(month, new Map());
        }
        const monthProcessed = userProcessed.get(month)!;
        
        // Verificar si ya hemos procesado este proyecto para este usuario y mes
        const projectKey = `${projectId}-${projectName}`;
        if (monthProcessed.has(projectKey)) {
          // Ya hemos contabilizado las horas para este proyecto, usuario y mes
          return;
        }
        
        // Marcar como procesado
        monthProcessed.set(projectKey, true);
        
        // Ahora, actualizar los datos del calendario
        if (!monthUserMap.has(month)) {
          monthUserMap.set(month, new Map());
        }
        
        const userMap = monthUserMap.get(month)!;
        if (!userMap.has(userName)) {
          userMap.set(userName, {
            userId,
            userName,
            days: new Set<number>(),
            ranges: new Set<string>(),
            projects: new Map<string, number>()
          });
        }
        
        const userData = userMap.get(userName)!;
        leaveDays.forEach(day => userData.days.add(day));
        
        if (ranges) {
          userData.ranges.add(ranges);
        }
        
        // Añadir las horas del proyecto (ahora solo una vez por proyecto/usuario/mes)
        if (projectName) {
          userData.projects.set(projectName, reservedHours);
        }
      });
      
      // Convertir a formato para renderizar con tipos explícitos
      return Array.from(monthUserMap.entries()).map(([month, userMap]) => ({
        month,
        users: Array.from(userMap.values()).map(userData => ({
          ...userData,
          days: Array.from(userData.days).sort((a: number, b: number) => a - b),
          ranges: Array.from(userData.ranges).join(', '),
          projects: Array.from(userData.projects.entries())
            .map(([projectName, hours]) => ({ projectName, hours }))
            .sort((a, b) => b.hours - a.hours)
        }))
      })).sort((a, b) => a.month.localeCompare(b.month));
    }, [filteredData]);
    
    if (calendarData.length === 0) {
      return <Typography>No hay datos de licencias para mostrar</Typography>;
    }
    
    // Definir un tipo para los datos de usuario
    type UserData = {
      userId: string | number;
      userName: string;
      days: number[];
      ranges: string;
      projects: { projectName: string; hours: number }[];
    };
    
    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ display: 'flex', minWidth: calendarData.length * 400 }}>
          {calendarData.map(monthData => {
            const allUsersExpanded = monthData.users.every(user => 
              expandedRows.has(`${user.userId}-${monthData.month}`)
            );
            
            return (
              <Box key={monthData.month} sx={{ flex: '0 0 auto', width: 400, mr: 2, border: '1px solid #ddd', borderRadius: 1, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    {formatMonth(monthData.month)}
                  </Typography>
                </Box>
                
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Usuario</th>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        Días de licencia
                      </th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', width: '80px' }}>
                        Proyectos
                        <button 
                          onClick={() => {
                            // Si hay al menos un proyecto expandido, colapsar todos
                            if ([...expandedProjects].some(key => key.includes(`-${monthData.month}-projects`))) {
                              // Filtrar para quitar todos los proyectos de este mes
                              const newExpandedProjects = new Set([...expandedProjects].filter(
                                key => !key.includes(`-${monthData.month}-projects`)
                              ));
                              setExpandedProjects(newExpandedProjects);
                            } else {
                              // Si no hay ninguno expandido, expandir todos (comportamiento original)
                              toggleAllProjectsInMonth(monthData.month, monthData.users);
                            }
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            fontSize: '16px',
                            color: '#1976d2'
                          }}
                        >
                          {[...expandedProjects].some(key => key.includes(`-${monthData.month}-projects`)) ? '−' : '+'}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthData.users.map((userData: UserData) => {
                      const rowKey = `${userData.userId}-${monthData.month}`;
                      const isExpanded = expandedRows.has(rowKey);
                      const projectsKey = `${userData.userId}-${monthData.month}-projects`;
                      const areProjectsExpanded = expandedProjects.has(projectsKey);
                      
                      return (
                        <React.Fragment key={rowKey}>
                          <tr 
                            style={{ backgroundColor: '#f9f9f9' }}
                          >
                            <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                              {userData.userName}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                              {userData.ranges || `${userData.days.length} días`}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                              <button 
                                onClick={(e) => toggleProjectsExpansion(userData.userId.toString(), monthData.month, e)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  color: '#1976d2'
                                }}
                              >
                                {areProjectsExpanded ? 'Ocultar' : 'Proyectos'}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Detalles de proyectos */}
                          {areProjectsExpanded && (
                            <tr>
                              <td colSpan={3} style={{ padding: 0, borderBottom: '1px solid #ddd' }}>
                                <Box sx={{ p: 1, backgroundColor: '#e3f2fd' }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Proyectos y horas reservadas:
                                  </Typography>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr>
                                        <th style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ccc', fontSize: '0.875rem' }}>Proyecto</th>
                                        <th style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '0.875rem' }}>Horas</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {userData.projects.map((project, idx) => (
                                        <tr key={idx} style={{ 
                                          backgroundColor: project.hours > 0 ? '#e8f5e9' : 'transparent',
                                          fontWeight: project.hours > 0 ? 'bold' : 'normal'
                                        }}>
                                          <td style={{ padding: '4px', textAlign: 'left', borderBottom: '1px solid #ccc', fontSize: '0.875rem' }}>
                                            {project.projectName}
                                          </td>
                                          <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ccc', fontSize: '0.875rem' }}>
                                            {safeNumberFormatter(project.hours)}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr style={{ fontWeight: 'bold' }}>
                                        <td style={{ padding: '4px', textAlign: 'left', borderTop: '2px solid #ccc', fontSize: '0.875rem' }}>
                                          Total
                                        </td>
                                        <td style={{ padding: '4px', textAlign: 'right', borderTop: '2px solid #ccc', fontSize: '0.875rem' }}>
                                          {safeNumberFormatter(userData.projects.reduce((sum, p) => sum + p.hours, 0))}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </Box>
                              </td>
                            </tr>
                          )}
                          
                          {/* Se eliminó el calendario expandido */}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };
  
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
      
      {/* Calendario de licencias */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Calendario de licencias
        </Typography>
        <LeavesCalendar filteredData={filteredData} />
      </Paper>
    </Box>
  );
};

export default LeavesChartV2;