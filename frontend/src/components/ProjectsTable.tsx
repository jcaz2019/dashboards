import React, { useMemo, memo, useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  LinearProgress, Typography, Chip, Box, CircularProgress, TextField,
  TablePagination
} from '@mui/material';
import { Project } from '../types/project';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
}

// Memoizar los componentes de celda para reducir re-renders
const StatusChip = memo(({ status }: { status: string }) => {
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

  return (
    <Chip 
      label={status} 
      color={getStatusColor(status) as any}
      size="small"
    />
  );
});

const DeliveryStatusChip = memo(({ status }: { status: string }) => {
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

  return (
    <Chip 
      label={status.replace(/_/g, ' ')} 
      color={getDeliveryStatusColor(status) as any}
      size="small"
    />
  );
});

const TaskProgressCell = memo(({ percentage }: { percentage: number | null }) => {
  const value = typeof percentage === 'number' ? percentage : 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <LinearProgress 
        variant="determinate" 
        value={value} 
        sx={{ width: '100%', mb: 1 }}
      />
      <Typography variant="caption">
        {value.toFixed(0)}%
      </Typography>
    </Box>
  );
});

const HoursProgressCell = memo(({ percentage }: { percentage: number | null }) => {
  if (percentage === null) return <Typography>N/A</Typography>;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <LinearProgress 
        variant="determinate" 
        value={percentage} 
        sx={{ width: '100%', mb: 1 }}
        color="success"
      />
      <Typography variant="caption">
        {percentage.toFixed(0)}%
      </Typography>
    </Box>
  );
});

const MarginCell = memo(({ percentage }: { percentage: number | null }) => {
  if (percentage === null || typeof percentage !== 'number') return <Typography>N/A</Typography>;
  
  return (
    <Typography 
      variant="body2" 
      color={percentage >= 0 ? 'success.main' : 'error.main'}
    >
      {percentage.toFixed(2)}%
    </Typography>
  );
});

const ProjectsTable: React.FC<ProjectsTableProps> = ({ projects, isLoading }) => {
  // Estados para paginación y filtrado
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar y paginar datos
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    
    const term = searchTerm.toLowerCase();
    return projects.filter(project => 
      project.client_name?.toLowerCase().includes(term) ||
      project.project_name?.toLowerCase().includes(term) ||
      project.project_status?.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  const paginatedProjects = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProjects.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProjects, page, rowsPerPage]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
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
    <Box>
      {/* Barra de búsqueda */}
      <Box sx={{ p: 2 }}>
        <TextField 
          fullWidth
          variant="outlined"
          placeholder="Search by client, project or status"
          value={searchTerm}
          onChange={handleSearchChange}
          size="small"
        />
      </Box>

      <TableContainer sx={{ maxHeight: 550 }}>
        <Table stickyHeader aria-label="projects table">
          <TableHead>
            <TableRow>
              <TableCell>Client</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Task Progress</TableCell>
              <TableCell>Hours Progress</TableCell>
              <TableCell>Margin %</TableCell>
              <TableCell>Delivery Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProjects.map((project) => (
              <TableRow key={project.project_id} hover>
                <TableCell>{project.client_name}</TableCell>
                <TableCell>{project.project_name}</TableCell>
                <TableCell>
                  <StatusChip status={project.project_status} />
                </TableCell>
                <TableCell>
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  <TaskProgressCell percentage={project.task_progress_percentage} />
                </TableCell>
                <TableCell>
                  <HoursProgressCell percentage={project.hours_progress_percentage} />
                </TableCell>
                <TableCell>
                  <MarginCell percentage={project.margin_percentage} />
                </TableCell>
                <TableCell>
                  <DeliveryStatusChip status={project.delivery_status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Paginación */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredProjects.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default ProjectsTable;