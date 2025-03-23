import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Typography, Box, CircularProgress 
} from '@mui/material';
import { TaskMetrics } from '../types/project';

interface TaskMetricsTableProps {
  tasks: TaskMetrics[];
  isLoading: boolean;
}

const TaskMetricsTable: React.FC<TaskMetricsTableProps> = ({ tasks, isLoading }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tasks.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography variant="body1">No task metrics found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
      <Table stickyHeader aria-label="task metrics table">
        <TableHead>
          <TableRow>
            <TableCell>Area</TableCell>
            <TableCell>Position</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Task</TableCell>
            <TableCell>Day</TableCell>
            <TableCell>Gross Capacity</TableCell>
            <TableCell>Capacity</TableCell>
            <TableCell>Scheduled Hours</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((task, index) => (
            <TableRow key={index} hover>
              <TableCell>{task.area}</TableCell>
              <TableCell>{task.position}</TableCell>
              <TableCell>{task.user}</TableCell>
              <TableCell>{task.project_name}</TableCell>
              <TableCell>{task.task_name}</TableCell>
              <TableCell>{new Date(task.day).toLocaleDateString()}</TableCell>
              <TableCell>{task.gross_capacity}</TableCell>
              <TableCell>{task.capacity}</TableCell>
              <TableCell>{task.scheduled_hs}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskMetricsTable; 