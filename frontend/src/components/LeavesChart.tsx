import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, Typography, CircularProgress, Paper, Grid, FormControl,
  InputLabel, Select, MenuItem, SelectChangeEvent, Divider
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LabelList
} from 'recharts';
import { LeaveData } from '../types/project';

interface LeavesChartProps {
  leavesData: LeaveData[];
  isLoading: boolean;
}

// Función mejorada para parsear el string de licencias y obtener los días
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

// Añadir un formateador seguro para las etiquetas del gráfico
const safeNumberFormatter = (value: any) => {
  // Si el valor es undefined o null, devolver "0"
  if (value === undefined || value === null) return "0";
  
  // Intentar convertir a número
  const num = Number(value);
  
  // Verificar si es un número válido
  if (!isNaN(num)) {
    // Si es un número entero, no mostrar decimales
    if (Number.isInteger(num)) {
      return num.toString();
    }
    // Si tiene decimales, mostrar solo un decimal
    return num.toFixed(1);
  }
  
  // Si no es un número válido, devolver "0"
  return "0";
};

const LeavesChart: React.FC<LeavesChartProps> = ({ leavesData, isLoading }) => {
  // Estados para los filtros
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  
  // Extraer meses, usuarios y proyectos únicos para los filtros
  const { months, users, projects } = useMemo(() => {
    // Intentar extraer meses de diferentes formatos
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
            // Asegurarse de que el mes tenga dos dígitos (01, 02, etc.)
            const monthNum = String(date.getMonth() + 1).padStart(2, '0');
            return `${year}-${monthNum}`;
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      
      return null; // Si no se puede extraer un mes válido
    }).filter(Boolean) as string[]; // Filtrar valores nulos
    
    const uniqueMonths = Array.from(new Set(monthsFromData)).sort();
    console.log('Meses extraídos:', uniqueMonths);
    
    // Obtener usuarios únicos que tienen licencias
    const usersWithLeaves = leavesData
      .filter(item => {
        const leaveDays = parseLeaveDays(item.licencias);
        return leaveDays.length > 0; // Solo incluir usuarios con días de licencia
      })
      .map(item => item.user_name);
    
    const uniqueUsers = Array.from(new Set(usersWithLeaves)).sort();
    
    // Obtener proyectos únicos
    const uniqueProjects = Array.from(new Set(
      leavesData
        .filter(item => item.project_name && item.project_name.trim() !== '')
        .map(item => item.project_name)
    )).sort();
    
    return { 
      months: uniqueMonths, 
      users: uniqueUsers,
      projects: uniqueProjects
    };
  }, [leavesData]);
  
  // Función para formatear el mes de manera más legible
  const formatMonth = (monthStr: string) => {
    try {
      // Si es una fecha completa con formato ISO, extraer solo el año y mes
      if (monthStr.includes('T')) {
        const date = new Date(monthStr);
        if (!isNaN(date.getTime())) {
          // Formato abreviado del mes (3 letras) y año
          const month = date.toLocaleDateString('es-ES', { month: 'short' });
          // Capitalizar la primera letra y tomar solo las primeras 3 letras
          const shortMonth = month.charAt(0).toUpperCase() + month.slice(1, 3);
          return `${shortMonth}-${date.getFullYear()}`;
        }
      }
      
      // Para formato YYYY-MM
      if (/^\d{4}-\d{2}$/.test(monthStr)) {
        const date = new Date(monthStr + '-01');
        if (!isNaN(date.getTime())) {
          // Formato abreviado del mes (3 letras) y año
          const month = date.toLocaleDateString('es-ES', { month: 'short' });
          // Capitalizar la primera letra y tomar solo las primeras 3 letras
          const shortMonth = month.charAt(0).toUpperCase() + month.slice(1, 3);
          return `${shortMonth}-${date.getFullYear()}`;
        }
      }
      
      return monthStr; // Si no se puede formatear, devolver el string original
    } catch (error) {
      console.error('Error formatting month:', error);
      return monthStr;
    }
  };
  
  // Manejadores para los filtros
  const handleMonthChange = (event: SelectChangeEvent) => {
    setSelectedMonth(event.target.value);
  };
  
  const handleUserChange = (event: SelectChangeEvent) => {
    setSelectedUser(event.target.value);
  };
  
  // Manejadores para los filtros de rango de meses
  const handleStartMonthChange = (event: SelectChangeEvent) => {
    setStartMonth(event.target.value);
  };
  
  const handleEndMonthChange = (event: SelectChangeEvent) => {
    setEndMonth(event.target.value);
  };
  
  // Manejador para el filtro de proyectos
  const handleProjectChange = (event: SelectChangeEvent) => {
    setSelectedProject(event.target.value);
  };
  
  // Inicializar los filtros cuando cambian los meses disponibles
  useEffect(() => {
    if (months.length > 0) {
      console.log('Actualizando selectores de meses con:', months);
      
      // Forzar la actualización de los selectores
      setSelectedMonth('all');
      
      if (!startMonth || !months.includes(startMonth)) {
        const firstMonth = months[0];
        console.log('Estableciendo mes de inicio:', firstMonth);
        setStartMonth(firstMonth);
      }
      
      if (!endMonth || !months.includes(endMonth)) {
        const lastMonth = months[months.length - 1];
        console.log('Estableciendo mes de fin:', lastMonth);
        setEndMonth(lastMonth);
      }
    } else {
      console.warn('No hay meses disponibles para los filtros');
    }
  }, [months]);
  
  // Filtrar datos según las selecciones
  const filteredData = useMemo(() => {
    let filtered = leavesData;
    
    // Aplicar filtro de usuario
    if (selectedUser !== 'all') {
      filtered = filtered.filter(item => item.user_name === selectedUser);
    }
    
    // Aplicar filtro de proyecto
    if (selectedProject !== 'all') {
      filtered = filtered.filter(item => item.project_name === selectedProject);
    }
    
    // Aplicar filtro de mes individual o rango
    if (selectedMonth !== 'all') {
      // Extraer el mes del formato ISO si es necesario
      filtered = filtered.filter(item => {
        // Si el item.month ya está en formato YYYY-MM
        if (/^\d{4}-\d{2}$/.test(item.month)) {
          return item.month === selectedMonth;
        }
        
        // Si el item.month está en formato ISO
        if (item.month && item.month.includes('T')) {
          try {
            const date = new Date(item.month);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const monthNum = String(date.getMonth() + 1).padStart(2, '0');
              const formattedMonth = `${year}-${monthNum}`;
              return formattedMonth === selectedMonth;
            }
          } catch (e) {
            console.error('Error parsing date for filtering:', e);
          }
        }
        
        return false;
      });
    } else {
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
    }
    
    console.log(`Filtrado: ${filtered.length} registros con mes=${selectedMonth}, usuario=${selectedUser}, proyecto=${selectedProject}`);
    
    return filtered;
  }, [leavesData, selectedMonth, selectedUser, selectedProject, startMonth, endMonth]);
  
  // Procesar datos para el gráfico de usuarios con licencias
  const userLeavesData = useMemo(() => {
    // Agrupar por usuario y mes para evitar contar días duplicados
    const userMonthMap = new Map<string, Map<string, Set<number>>>();
    
    // Primero, agrupar los días de licencia por usuario y mes
    filteredData.forEach(item => {
      const userId = item.user_id.toString();
      const month = item.month;
      const leaveDays = parseLeaveDays(item.licencias);
      
      if (!userMonthMap.has(userId)) {
        userMonthMap.set(userId, new Map<string, Set<number>>());
      }
      
      const monthMap = userMonthMap.get(userId)!;
      if (!monthMap.has(month)) {
        monthMap.set(month, new Set<number>());
      }
      
      const daysSet = monthMap.get(month)!;
      leaveDays.forEach(day => daysSet.add(day));
    });
    
    // Ahora, crear el mapa de usuarios con los datos agregados
    const userMap = new Map();
    
    filteredData.forEach(item => {
      const userId = item.user_id.toString();
      const reservedHours = Number(item.reserved_hours) || 0;
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: item.user_id,
          user_name: item.user_name,
          total_leave_days: 0, // Se calculará después
          total_reserved_hours: 0,
          months_count: new Set(),
          projects_count: new Set(),
          hours_per_leave_day: 0,
          // Guardar los rangos originales para mostrarlos
          leave_ranges: new Set()
        });
      }
      
      const userData = userMap.get(userId);
      userData.total_reserved_hours += reservedHours;
      userData.months_count.add(item.month);
      userData.projects_count.add(item.project_id);
      
      // Guardar el rango original de licencias
      if (item.licencias) {
        userData.leave_ranges.add(item.licencias);
      }
    });
    
    // Calcular el total de días de licencia para cada usuario
    userMap.forEach((userData, userId) => {
      const monthMap = userMonthMap.get(userId);
      if (monthMap) {
        let totalDays = 0;
        monthMap.forEach(daysSet => {
          totalDays += daysSet.size;
        });
        userData.total_leave_days = totalDays;
      }
    });
    
    // Convertir el Map a un array y calcular horas por día de licencia
    return Array.from(userMap.values()).map(user => {
      user.months_count = user.months_count.size;
      user.projects_count = user.projects_count.size;
      user.leave_ranges = Array.from(user.leave_ranges).join(', ');
      user.hours_per_leave_day = user.total_leave_days > 0 
        ? user.total_reserved_hours / user.total_leave_days 
        : 0;
      
      // Asegurarse de que todos los valores sean numéricos
      user.total_leave_days = Number(user.total_leave_days) || 0;
      user.total_reserved_hours = Number(user.total_reserved_hours) || 0;
      user.hours_per_leave_day = Number(user.hours_per_leave_day) || 0;
      
      return user;
    }).sort((a, b) => b.total_reserved_hours - a.total_reserved_hours);
  }, [filteredData]);
  
  // Procesar datos para el gráfico de proyectos con usuarios en licencia
  const projectLeavesData = useMemo(() => {
    // Agrupar por proyecto
    const projectMap = new Map<string, {
      project_name: string;
      total_leave_days: number;
      total_reserved_hours: number;
      users: Set<string>;
    }>();
    
    filteredData.forEach(item => {
      const leaveDays = parseLeaveDays(item.licencias).length;
      if (leaveDays === 0) return; // Ignorar registros sin licencias
      
      if (!projectMap.has(item.project_name)) {
        projectMap.set(item.project_name, {
          project_name: item.project_name,
          total_leave_days: 0,
          total_reserved_hours: 0,
          users: new Set()
        });
      }
      
      const projectData = projectMap.get(item.project_name)!;
      projectData.total_leave_days += leaveDays;
      projectData.total_reserved_hours += item.reserved_hours;
      projectData.users.add(item.user_name);
    });
    
    // Convertir a array para el gráfico
    return Array.from(projectMap.values())
      .map(project => ({
        project_name: project.project_name,
        total_leave_days: project.total_leave_days,
        total_reserved_hours: project.total_reserved_hours,
        users_count: project.users.size,
        hours_per_leave_day: project.total_leave_days > 0 
          ? project.total_reserved_hours / project.total_leave_days 
          : 0
      }))
      .sort((a, b) => b.total_reserved_hours - a.total_reserved_hours);
  }, [filteredData]);
  
  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="subtitle2">{label}</Typography>
          <Typography variant="body2" color="text.secondary">
            Horas planificadas: {safeNumberFormatter(payload[0].value)}
          </Typography>
          {payload[0].payload.users_count && (
            <Typography variant="body2" color="text.secondary">
              Usuarios: {payload[0].payload.users_count}
            </Typography>
          )}
        </Paper>
      );
    }
    return null;
  };
  
  useEffect(() => {
    console.log('LeavesData:', leavesData);
    console.log('Is Loading:', isLoading);
    
    // Verificar si hay valores no numéricos en reserved_hours
    const nonNumericValues = leavesData.filter(item => 
      isNaN(Number(item.reserved_hours)) || item.reserved_hours === null || item.reserved_hours === undefined
    );
    
    if (nonNumericValues.length > 0) {
      console.warn('Valores no numéricos encontrados en reserved_hours:', nonNumericValues);
    }
  }, [leavesData, isLoading]);
  
  // Depurar los datos de licencias para entender mejor los problemas
  useEffect(() => {
    console.log('Datos de licencias recibidos:', leavesData.length);
    
    if (leavesData.length > 0) {
      // Mostrar algunos ejemplos de datos
      console.log('Ejemplos de datos:', leavesData.slice(0, 3));
      
      // Verificar el formato de los meses
      const monthFormats = leavesData.slice(0, 5).map(item => ({
        month: item.month,
        isYYYYMM: /^\d{4}-\d{2}$/.test(item.month),
        isISO: item.month && item.month.includes('T'),
        parsed: item.month && item.month.includes('T') ? 
          (() => {
            try {
              const date = new Date(item.month);
              return !isNaN(date.getTime()) ? 
                `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` : 
                'invalid';
            } catch (e) {
              return 'error';
            }
          })() : 
          'not-iso'
      }));
      
      console.log('Formatos de meses (muestra):', monthFormats);
    }
    
    // Cuando se selecciona un mes específico
    if (selectedMonth !== 'all') {
      console.log(`Mes seleccionado: ${selectedMonth}`);
      
      // Verificar cuántos registros coinciden exactamente con ese mes
      const exactMatches = leavesData.filter(item => item.month === selectedMonth).length;
      console.log(`Coincidencias exactas: ${exactMatches}`);
      
      // Verificar cuántos registros coinciden después de normalizar el formato
      const normalizedMatches = leavesData.filter(item => {
        if (/^\d{4}-\d{2}$/.test(item.month)) {
          return item.month === selectedMonth;
        }
        
        if (item.month && item.month.includes('T')) {
          try {
            const date = new Date(item.month);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const monthNum = String(date.getMonth() + 1).padStart(2, '0');
              return `${year}-${monthNum}` === selectedMonth;
            }
          } catch (e) {}
        }
        
        return false;
      }).length;
      
      console.log(`Coincidencias normalizadas: ${normalizedMatches}`);
    }
  }, [leavesData, selectedMonth]);
  
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
                        <button 
                          onClick={() => toggleAllUsersInMonth(monthData.month, monthData.users)}
                          style={{ 
                            background: 'none', 
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            fontSize: '16px',
                            color: '#1976d2'
                          }}
                        >
                          {allUsersExpanded ? '−' : '+'}
                        </button>
                      </th>
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', width: '80px' }}>
                        Proyectos
                        <button 
                          onClick={() => toggleAllProjectsInMonth(monthData.month, monthData.users)}
                          style={{ 
                            background: 'none', 
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '8px',
                            fontSize: '16px',
                            color: '#1976d2'
                          }}
                        >
                          {monthData.users.every(user => 
                            expandedProjects.has(`${user.userId}-${monthData.month}-projects`)
                          ) ? '−' : '+'}
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
                            onClick={() => toggleRowExpansion(userData.userId.toString(), monthData.month)}
                            style={{ cursor: 'pointer', backgroundColor: '#f9f9f9' }}
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
                          
                          {/* Calendario expandido */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={3} style={{ padding: 0, borderBottom: '1px solid #ddd' }}>
                                <Box sx={{ p: 1, backgroundColor: '#f0f0f0' }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                      <Box 
                                        key={day}
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderRadius: '50%',
                                          backgroundColor: userData.days.includes(day) ? '#8884d8' : 'transparent',
                                          color: userData.days.includes(day) ? 'white' : 'inherit',
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        {day}
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              </td>
                            </tr>
                          )}
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="user-select-label">Usuario</InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUser}
                label="Usuario"
                onChange={handleUserChange}
              >
                <MenuItem value="all">Todos los usuarios</MenuItem>
                {users.map(user => (
                  <MenuItem key={user} value={user}>{user}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="project-select-label">Proyecto</InputLabel>
              <Select
                labelId="project-select-label"
                value={selectedProject}
                label="Proyecto"
                onChange={handleProjectChange}
              >
                <MenuItem value="all">Todos los proyectos</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project} value={project}>{project}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="month-select-label">Mes</InputLabel>
              <Select
                labelId="month-select-label"
                value={selectedMonth}
                label="Mes"
                onChange={handleMonthChange}
              >
                <MenuItem value="all">Todos los meses</MenuItem>
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
          
          {selectedMonth === 'all' && (
            <>
              <Grid item xs={12}>
                <Divider>
                  <Typography variant="subtitle1">Filtrar por rango de meses</Typography>
                </Divider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
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
              
              <Grid item xs={12} sm={6}>
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
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Resumen */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Resumen
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <Typography variant="h4">
                {safeReduce(userLeavesData, user => user.total_leave_days)}
              </Typography>
              <Typography variant="body2">Días de licencia</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.light', color: 'white' }}>
              <Typography variant="h4">
                {safeNumberFormatter(safeReduce(userLeavesData, user => user.total_reserved_hours))}
              </Typography>
              <Typography variant="body2">Horas planificadas</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <Typography variant="h4">
                {userLeavesData.length}
              </Typography>
              <Typography variant="body2">Usuarios con licencias</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <Typography variant="h4">
                {projectLeavesData.length}
              </Typography>
              <Typography variant="body2">Proyectos afectados</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Gráfico de usuarios con licencias */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Usuarios con licencias
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Muestra los días de licencia y horas planificadas por usuario
        </Typography>
        
        <Box sx={{ height: 400 }}>
          {userLeavesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userLeavesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user_name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={safeNumberFormatter} />
                <Legend />
                <Bar yAxisId="left" dataKey="total_leave_days" name="Días de licencia" fill="#8884d8">
                  <LabelList dataKey="total_leave_days" position="top" formatter={safeNumberFormatter} />
                </Bar>
                <Bar yAxisId="right" dataKey="total_reserved_hours" name="Horas planificadas" fill="#82ca9d">
                  <LabelList dataKey="total_reserved_hours" position="top" formatter={safeNumberFormatter} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography>No hay datos para mostrar con los filtros seleccionados</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Gráfico de proyectos con usuarios en licencia */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Proyectos con usuarios en licencia
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Muestra las horas planificadas por proyecto para usuarios con licencias
        </Typography>
        
        <Box sx={{ height: 400 }}>
          {projectLeavesData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectLeavesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="project_name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="total_reserved_hours" 
                  name="Horas planificadas" 
                  fill="#82ca9d"
                >
                  <LabelList 
                    dataKey="total_reserved_hours" 
                    position="top" 
                    formatter={safeNumberFormatter}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography>No hay datos para mostrar con los filtros seleccionados</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Añadir una tabla detallada de usuarios con licencias */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Detalle de usuarios con licencias
        </Typography>
        
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Usuario</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Días de licencia</th>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Rangos</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Horas planificadas</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Proyectos</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Meses</th>
                <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Horas/día</th>
              </tr>
            </thead>
            <tbody>
              {userLeavesData
                .filter(user => user.total_leave_days > 0) // Mostrar solo usuarios con licencias
                .map((user, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{user.user_name}</td>
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{user.total_leave_days}</td>
                    <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{user.leave_ranges}</td>
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{safeNumberFormatter(user.total_reserved_hours)}</td>
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{user.projects_count}</td>
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{user.months_count}</td>
                    <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{safeNumberFormatter(user.hours_per_leave_day)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Box>
      </Paper>
      
      {/* Añadir el calendario al componente principal */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Calendario de licencias
        </Typography>
        <LeavesCalendar filteredData={filteredData} />
      </Paper>
    </Box>
  );
};

export default LeavesChart; 