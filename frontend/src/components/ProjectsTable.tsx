import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  LinearProgress, Typography, Chip, Box, CircularProgress 
} from '@mui/material';
import { Project } from '../types/project';

interface ProjectsTableProps {
  projects: Project[];
  isLoading: boolean;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({ projects, isLoading }) => {
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

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
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
          {projects.map((project) => (
            <TableRow key={project.project_id} hover>
              <TableCell>{project.client_name}</TableCell>
              <TableCell>{project.project_name}</TableCell>
              <TableCell>
                <Chip 
                  label={project.project_status} 
                  color={getStatusColor(project.project_status) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={project.task_progress_percentage || 0} 
                    sx={{ width: '100%', mb: 1 }}
                  />
                  <Typography variant="caption">
                    {(project.task_progress_percentage || 0).toFixed(0)}%
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                {project.hours_progress_percentage !== null ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={project.hours_progress_percentage} 
                      sx={{ width: '100%', mb: 1 }}
                      color="success"
                    />
                    <Typography variant="caption">
                      {project.hours_progress_percentage.toFixed(0)}%
                    </Typography>
                  </Box>
                ) : 'N/A'}
              </TableCell>
              <TableCell>
                {project.margin_percentage !== null ? (
                  <Typography 
                    variant="body2" 
                    color={project.margin_percentage >= 0 ? 'success.main' : 'error.main'}
                  >
                    {project.margin_percentage.toFixed(2)}%
                  </Typography>
                ) : 'N/A'}
              </TableCell>
              <TableCell>
                <Chip 
                  label={project.delivery_status.replace(/_/g, ' ')} 
                  color={getDeliveryStatusColor(project.delivery_status) as any}
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ProjectsTable; 