import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Line, ComposedChart, LabelList, Bar
} from 'recharts';
import { 
  Box, Typography, CircularProgress, Paper, List, ListItem, 
  ListItemText, ListItemButton, Collapse, Divider, FormControl,
  InputLabel, Select, MenuItem, SelectChangeEvent, Grid
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { TaskMetrics } from '../types/project';

interface CapacityUsageChartProps {
  tasks: TaskMetrics[];
  isLoading: boolean;
}

// Estructura para los datos diarios
interface DailyCapacity {
  day: string;
  grossCapacity: number;
  scheduledHours: number;
  availableHours: number;
  availabilityPercentage: number;
}

// Estructura de proyecto dentro del desglose diario
interface ProjectBreakdown {
  scheduledHours: number;
  percentageOfCapacity: number;
}

// Estructura para datos diarios en la jerarquía
interface DailyNodeData {
  grossCapacity: number;
  scheduledHours: number;
  availableHours: number;
  availabilityPercentage: number;
  projectBreakdown?: Record<string, ProjectBreakdown>;
}

// Estructura para los datos agrupados por jerarquía
interface HierarchyNode {
  id: string;
  name: string;
  type: 'area' | 'position' | 'user' | 'project';
  dailyData: Record<string, DailyNodeData>;
  children?: HierarchyNode[];
  parentId?: string;
}

// Custom tooltip para el gráfico
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Divider sx={{ my: 0.5 }} />
        {payload.map((entry: any, index: number) => (
          <Box key={`item-${index}`} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-block', 
                width: 10, 
                height: 10, 
                bgcolor: entry.color, 
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>
              {entry.name}:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {entry.dataKey.includes('Percentage') ? 
                `${entry.value.toFixed(2)}%` : 
                `${entry.value.toFixed(2)} hs`}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  }
  return null;
};

const CapacityUsageChart: React.FC<CapacityUsageChartProps> = ({ tasks, isLoading }) => {
  // Estados para los filtros
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  
  // Estado para los datos procesados
  const [dailyData, setDailyData] = useState<DailyCapacity[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([]));
  
  // Listas de filtros disponibles
  const [areas, setAreas] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  // Manejadores para los filtros
  const handleAreaChange = (event: SelectChangeEvent) => {
    setSelectedArea(event.target.value);
    setSelectedPosition('all');
    setSelectedUser('all');
  };

  const handlePositionChange = (event: SelectChangeEvent) => {
    setSelectedPosition(event.target.value);
    setSelectedUser('all');
  };

  const handleUserChange = (event: SelectChangeEvent) => {
    setSelectedUser(event.target.value);
  };

  // Manejar expansión/colapso de nodos
  const handleNodeToggle = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Manejar selección de nodo
  const handleNodeSelect = (node: HierarchyNode) => {
    // Aquí se podría implementar alguna acción al seleccionar un nodo
    console.log('Selected node:', node);
  };

  // Procesar los datos cuando cambian las tareas o los filtros
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // Extraer listas únicas para los filtros
    const uniqueAreas = Array.from(new Set(tasks.map(task => task.area))).sort();
    const uniquePositions = Array.from(new Set(tasks.map(task => task.position))).sort();
    const uniqueUsers = Array.from(new Set(tasks.map(task => task.user))).sort();
    
    setAreas(uniqueAreas);
    setPositions(uniquePositions);
    setUsers(uniqueUsers);
    
    // Procesar los datos para el gráfico diario y la estructura jerárquica
    const { dailyCapacityData, hierarchicalData } = processData(tasks, selectedArea, selectedPosition, selectedUser);
    
    setDailyData(dailyCapacityData);
    setHierarchyData(hierarchicalData);
    
    // Expandir por defecto todos los nodos de nivel superior
    const initialExpanded = new Set<string>(hierarchicalData.map(node => node.id));
    setExpandedNodes(initialExpanded);
  }, [tasks, selectedArea, selectedPosition, selectedUser]);

  // Procesar los datos para crear el gráfico y la tabla jerárquica
  const processData = (
    tasks: TaskMetrics[], 
    areaFilter: string, 
    positionFilter: string, 
    userFilter: string
  ) => {
    // Aplicar filtros
    const filteredTasks = tasks.filter(task => {
      return (areaFilter === 'all' || task.area === areaFilter) &&
             (positionFilter === 'all' || task.position === positionFilter) &&
             (userFilter === 'all' || task.user === userFilter);
    });
    
    // Agrupar por día para el gráfico de barras
    const dailyMap = new Map<string, {
      grossCapacity: number;
      scheduledHours: number;
    }>();
    
    filteredTasks.forEach(task => {
      const day = task.day;
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { grossCapacity: 0, scheduledHours: 0 });
      }
      
      const dayData = dailyMap.get(day)!;
      dayData.grossCapacity += task.gross_capacity;
      dayData.scheduledHours += task.scheduled_hs;
    });
    
    // Convertir a array para el gráfico y calcular disponibilidad
    const dailyCapacityData: DailyCapacity[] = Array.from(dailyMap.entries())
      .map(([day, data]) => {
        const availableHours = Math.max(0, data.grossCapacity - data.scheduledHours);
        const availabilityPercentage = data.grossCapacity > 0 
          ? (availableHours / data.grossCapacity) * 100 
          : 0;
          
        return {
          day,
          grossCapacity: data.grossCapacity,
          scheduledHours: data.scheduledHours,
          availableHours,
          availabilityPercentage
        };
      })
      .sort((a, b) => a.day.localeCompare(b.day));
    
    // Crear la estructura jerárquica
    const hierarchyNodes: HierarchyNode[] = [];
    
    // Agrupar por área
    const areaGroups = groupBy(filteredTasks, task => task.area);
    
    // Para cada área
    Object.entries(areaGroups).forEach(([area, areaTasks]) => {
      const areaNode: HierarchyNode = {
        id: `area-${area}`,
        name: area,
        type: 'area',
        dailyData: {},
        children: []
      };
      
      // Inicializar datos diarios para el área
      const areaDailyData: Record<string, DailyNodeData> = {};
      
      // Agrupar por posición dentro del área
      const positionGroups = groupBy(areaTasks, task => task.position);
      
      // Para cada posición
      Object.entries(positionGroups).forEach(([position, positionTasks]) => {
        const positionNode: HierarchyNode = {
          id: `area-${area}-position-${position}`,
          name: position,
          type: 'position',
          parentId: areaNode.id,
          dailyData: {},
          children: []
        };
        
        // Inicializar datos diarios para la posición
        const positionDailyData: Record<string, DailyNodeData> = {};
        
        // Agrupar por usuario dentro de la posición
        const userGroups = groupBy(positionTasks, task => task.user);
        
        // Para cada usuario
        Object.entries(userGroups).forEach(([user, userTasks]) => {
          const userNode: HierarchyNode = {
            id: `area-${area}-position-${position}-user-${user}`,
            name: user,
            type: 'user',
            parentId: positionNode.id,
            dailyData: {},
            children: []
          };
          
          // Inicializar datos diarios para el usuario
          const userDailyData: Record<string, DailyNodeData> = {};
          
          // Agrupar por proyecto dentro del usuario
          const projectGroups = groupBy(userTasks, task => task.project_name);
          
          // Para cada proyecto
          Object.entries(projectGroups).forEach(([project, projectTasks]) => {
            const projectNode: HierarchyNode = {
              id: `area-${area}-position-${position}-user-${user}-project-${project}`,
              name: project,
              type: 'project',
              parentId: userNode.id,
              dailyData: {}
            };
            
            // Inicializar datos diarios para el proyecto
            const projectDailyData: Record<string, DailyNodeData> = {};
            
            // Agrupar por día dentro del proyecto
            const dailyGroups = groupBy(projectTasks, task => task.day);
            
            // Para cada día
            Object.entries(dailyGroups).forEach(([day, dayTasks]) => {
              // Sumar valores para el día
              const dailyGross = dayTasks.reduce((sum, task) => sum + task.gross_capacity, 0);
              const dailyScheduled = dayTasks.reduce((sum, task) => sum + task.scheduled_hs, 0);
              const dailyAvailable = Math.max(0, dailyGross - dailyScheduled);
              const dailyAvailabilityPercentage = dailyGross > 0 ? (dailyAvailable / dailyGross) * 100 : 0;
              
              // Almacenar en la estructura de datos del proyecto
              projectDailyData[day] = {
                grossCapacity: dailyGross,
                scheduledHours: dailyScheduled,
                availableHours: dailyAvailable,
                availabilityPercentage: dailyAvailabilityPercentage
              };
              
              // Acumular para el usuario
              if (!userDailyData[day]) {
                userDailyData[day] = {
                  grossCapacity: 0,
                  scheduledHours: 0,
                  availableHours: 0,
                  availabilityPercentage: 0,
                  projectBreakdown: {}
                };
              }
              
              userDailyData[day].grossCapacity += dailyGross;
              userDailyData[day].scheduledHours += dailyScheduled;
              
              // Almacenar desglose por proyecto
              if (!userDailyData[day].projectBreakdown![project]) {
                userDailyData[day].projectBreakdown![project] = {
                  scheduledHours: 0,
                  percentageOfCapacity: 0
                };
              }
              
              userDailyData[day].projectBreakdown![project].scheduledHours = dailyScheduled;
              
              // Acumular para la posición
              if (!positionDailyData[day]) {
                positionDailyData[day] = {
                  grossCapacity: 0,
                  scheduledHours: 0,
                  availableHours: 0,
                  availabilityPercentage: 0
                };
              }
              
              positionDailyData[day].grossCapacity += dailyGross;
              positionDailyData[day].scheduledHours += dailyScheduled;
              
              // Acumular para el área
              if (!areaDailyData[day]) {
                areaDailyData[day] = {
                  grossCapacity: 0,
                  scheduledHours: 0,
                  availableHours: 0,
                  availabilityPercentage: 0
                };
              }
              
              areaDailyData[day].grossCapacity += dailyGross;
              areaDailyData[day].scheduledHours += dailyScheduled;
            });
            
            // Calcular valores disponibles y porcentajes para todos los días del proyecto
            Object.values(projectDailyData).forEach(data => {
              data.availableHours = Math.max(0, data.grossCapacity - data.scheduledHours);
              data.availabilityPercentage = data.grossCapacity > 0 
                ? (data.availableHours / data.grossCapacity) * 100 
                : 0;
            });
            
            projectNode.dailyData = projectDailyData;
            userNode.children!.push(projectNode);
          });
          
          // Calcular valores disponibles y porcentajes para todos los días del usuario
          Object.entries(userDailyData).forEach(([day, data]) => {
            data.availableHours = Math.max(0, data.grossCapacity - data.scheduledHours);
            data.availabilityPercentage = data.grossCapacity > 0 
              ? (data.availableHours / data.grossCapacity) * 100 
              : 0;
            
            // Calcular porcentajes para los proyectos
            Object.entries(data.projectBreakdown!).forEach(([project, projectData]) => {
              projectData.percentageOfCapacity = data.grossCapacity > 0 
                ? (projectData.scheduledHours / data.grossCapacity) * 100 
                : 0;
            });
          });
          
          userNode.dailyData = userDailyData;
          positionNode.children!.push(userNode);
        });
        
        // Calcular valores disponibles y porcentajes para todos los días de la posición
        Object.entries(positionDailyData).forEach(([day, data]) => {
          data.availableHours = Math.max(0, data.grossCapacity - data.scheduledHours);
          data.availabilityPercentage = data.grossCapacity > 0 
            ? (data.availableHours / data.grossCapacity) * 100 
            : 0;
        });
        
        positionNode.dailyData = positionDailyData;
        areaNode.children!.push(positionNode);
      });
      
      // Calcular valores disponibles y porcentajes para todos los días del área
      Object.entries(areaDailyData).forEach(([day, data]) => {
        data.availableHours = Math.max(0, data.grossCapacity - data.scheduledHours);
        data.availabilityPercentage = data.grossCapacity > 0 
          ? (data.availableHours / data.grossCapacity) * 100 
          : 0;
      });
      
      areaNode.dailyData = areaDailyData;
      hierarchyNodes.push(areaNode);
    });
    
    return {
      dailyCapacityData,
      hierarchicalData: hierarchyNodes
    };
  };
  
  // Función auxiliar para agrupar un array
  const groupBy = <T, K extends string | number | symbol>(array: T[], getKey: (item: T) => K): Record<K, T[]> => {
    return array.reduce((result, item) => {
      const key = getKey(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {} as Record<K, T[]>);
  };

  // Componente para la tabla jerárquica
  const HierarchyTable = () => {
    const renderNode = (node: HierarchyNode, depth = 0) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;
      
      // Calcular promedios de disponibilidad
      const daysCount = Object.keys(node.dailyData).length;
      const averageAvailability = daysCount > 0
        ? Object.values(node.dailyData).reduce((sum, day) => sum + day.availabilityPercentage, 0) / daysCount
        : 0;
      
      return (
        <React.Fragment key={node.id}>
          <ListItem disablePadding sx={{ pl: depth * 2 }}>
            <ListItemButton 
              onClick={() => handleNodeSelect(node)}
              dense
            >
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography component="span">
                      {node.name} <Typography component="span" variant="caption">({node.type})</Typography>
                    </Typography>
                    <Typography color={averageAvailability > 20 ? 'success.main' : 'error'}>
                      {node.type === 'project' 
                        ? `${Object.values(node.dailyData).reduce((sum, day) => sum + (day.availabilityPercentage || 0), 0) / daysCount}% de capacidad`
                        : `${averageAvailability.toFixed(2)}% disponible`
                      }
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption">
                        Cap. Bruta: {Object.values(node.dailyData).reduce((sum, day) => sum + day.grossCapacity, 0).toFixed(1)} hs
                      </Typography>
                      <Typography variant="caption">
                        Disponible: {Object.values(node.dailyData).reduce((sum, day) => sum + day.availableHours, 0).toFixed(1)} hs
                      </Typography>
                    </Box>
                  </Box>
                }
              />
              {hasChildren && (
                <Box onClick={(e) => { 
                  e.stopPropagation();
                  handleNodeToggle(node.id);
                }}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </Box>
              )}
            </ListItemButton>
          </ListItem>
          
          {isExpanded && (
            <>
              {/* Mostrar desglose por día */}
              {Object.entries(node.dailyData).length > 0 && (
                <ListItem sx={{ pl: (depth + 1) * 2, pr: 2 }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Desglose por día:
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {Object.entries(node.dailyData)
                        .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
                        .map(([day, data]) => (
                          <Grid item xs={12} sm={6} md={4} key={day}>
                            <Paper 
                              elevation={1} 
                              sx={{ 
                                p: 1, 
                                bgcolor: data.availabilityPercentage > 20 ? 'success.light' : 'error.light',
                                color: 'white'
                              }}
                            >
                              <Typography variant="subtitle2">{day}</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption">
                                  Cap. Bruta: {data.grossCapacity.toFixed(1)} hs
                                </Typography>
                                <Typography variant="caption">
                                  Disp: {data.availableHours.toFixed(1)} hs ({data.availabilityPercentage.toFixed(1)}%)
                                </Typography>
                              </Box>
                              {node.type === 'user' && data.projectBreakdown && (
                                <>
                                  <Divider sx={{ my: 0.5 }} />
                                  <Typography variant="caption" sx={{ display: 'block' }}>
                                    Desglose por proyecto:
                                  </Typography>
                                  {Object.entries(data.projectBreakdown).map(([project, projectData]) => (
                                    <Typography key={project} variant="caption" display="block" sx={{ pl: 1 }}>
                                      {project}: {projectData.scheduledHours.toFixed(1)} hs ({projectData.percentageOfCapacity.toFixed(1)}%)
                                    </Typography>
                                  ))}
                                </>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                    </Grid>
                  </Box>
                </ListItem>
              )}
            </>
          )}
          
          {hasChildren && isExpanded && (
            <Collapse in={true} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {node.children?.map(childNode => renderNode(childNode, depth + 1))}
              </List>
            </Collapse>
          )}
        </React.Fragment>
      );
    };
    
    return (
      <Paper sx={{ maxHeight: 600, overflow: 'auto', mb: 2 }}>
        <List>
          {hierarchyData.map(node => renderNode(node))}
        </List>
      </Paper>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No task metrics found.</Typography>
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
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="area-select-label">Área</InputLabel>
              <Select
                labelId="area-select-label"
                value={selectedArea}
                label="Área"
                onChange={handleAreaChange}
              >
                <MenuItem value="all">Todas las áreas</MenuItem>
                {areas.map(area => (
                  <MenuItem key={area} value={area}>{area}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth disabled={selectedArea === 'all'}>
              <InputLabel id="position-select-label">Posición</InputLabel>
              <Select
                labelId="position-select-label"
                value={selectedPosition}
                label="Posición"
                onChange={handlePositionChange}
              >
                <MenuItem value="all">Todas las posiciones</MenuItem>
                {positions
                  .filter(pos => {
                    if (selectedArea === 'all') return true;
                    return tasks.some(task => 
                      task.area === selectedArea && task.position === pos
                    );
                  })
                  .map(position => (
                    <MenuItem key={position} value={position}>{position}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth disabled={selectedPosition === 'all'}>
              <InputLabel id="user-select-label">Usuario</InputLabel>
              <Select
                labelId="user-select-label"
                value={selectedUser}
                label="Usuario"
                onChange={handleUserChange}
              >
                <MenuItem value="all">Todos los usuarios</MenuItem>
                {users
                  .filter(user => {
                    if (selectedPosition === 'all') return true;
                    return tasks.some(task => 
                      (selectedArea === 'all' || task.area === selectedArea) && 
                      (selectedPosition === 'all' || task.position === selectedPosition) && 
                      task.user === user
                    );
                  })
                  .map(user => (
                    <MenuItem key={user} value={user}>{user}</MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Gráfico de barras por día */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Capacidad Diaria
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Muestra las horas planificadas vs disponibles por día
        </Typography>
        
        <Box sx={{ height: 400 }}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80} 
                  interval={0}
                />
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} 
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]}
                  label={{ value: 'Disponibilidad (%)', angle: 90, position: 'insideRight' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="scheduledHours" 
                  stackId="a" 
                  fill="#ff6b6b" 
                  name="Horas Planificadas"
                >
                  <LabelList 
                    dataKey="scheduledHours" 
                    position="inside" 
                    fill="#fff" 
                    formatter={(value: number) => value.toFixed(1)}
                  />
                </Bar>
                <Bar 
                  yAxisId="left"
                  dataKey="availableHours" 
                  stackId="a" 
                  fill="#4ecdc4" 
                  name="Horas Disponibles"
                >
                  <LabelList 
                    dataKey="availableHours" 
                    position="inside" 
                    fill="#fff" 
                    formatter={(value: number) => value.toFixed(1)}
                  />
                </Bar>
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="availabilityPercentage" 
                  stroke="#1a535c" 
                  strokeWidth={2} 
                  name="% Disponibilidad"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Typography>No hay datos para mostrar con los filtros seleccionados</Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Tabla jerárquica */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Desglose de Capacidad por Área / Posición / Usuario
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Haga clic en los elementos para expandir o contraer
        </Typography>
        
        <HierarchyTable />
      </Paper>
    </Box>
  );
};

export default CapacityUsageChart; 