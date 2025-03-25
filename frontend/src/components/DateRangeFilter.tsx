import React from 'react';
import { Box, Typography, TextField, Grid, Chip, Paper, FormControlLabel, Switch } from '@mui/material';

interface DateRangeFilterProps {
  // Fecha de inicio (range)
  startDateFrom?: string;
  startDateTo?: string;
  onStartDateFromChange: (date: string) => void;
  onStartDateToChange: (date: string) => void;
  
  // Fecha de finalización (range)
  endDateFrom?: string;
  endDateTo?: string;
  onEndDateFromChange: (date: string) => void;
  onEndDateToChange: (date: string) => void;
  
  // Control para activar/desactivar el filtro de proyectos finalizados
  isEndDateFilterApplied: boolean;
  onToggleEndDateFilter: () => void;
  
  // Títulos y descripciones personalizables
  title?: string;
  description?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDateFrom = '',
  startDateTo = '',
  endDateFrom = '',
  endDateTo = '',
  onStartDateFromChange,
  onStartDateToChange,
  onEndDateFromChange,
  onEndDateToChange,
  isEndDateFilterApplied,
  onToggleEndDateFilter,
  title = 'Filtrar por Fechas',
  description
}) => {
  // Función para formatear fechas en la interfaz
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        
        {description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {description}
          </Typography>
        )}
        
        {/* Filtro de fecha de inicio */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Rango de Fecha de Inicio
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Filtra proyectos que iniciaron dentro del rango seleccionado
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDateFrom}
                onChange={(e) => onStartDateFromChange(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={startDateTo}
                onChange={(e) => onStartDateToChange(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {startDateFrom && (
                  <Chip 
                    label={`Desde: ${formatDate(startDateFrom)}`} 
                    color="primary" 
                    onDelete={() => onStartDateFromChange('')}
                    variant="outlined"
                  />
                )}
                
                {startDateTo && (
                  <Chip 
                    label={`Hasta: ${formatDate(startDateTo)}`}
                    color="primary"
                    onDelete={() => onStartDateToChange('')}
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {/* Filtro de fecha de finalización */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Rango de Fecha de Finalización
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isEndDateFilterApplied}
                  onChange={onToggleEndDateFilter}
                  color="success"
                />
              }
              label={isEndDateFilterApplied ? "Activado" : "Desactivado"}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            {isEndDateFilterApplied 
              ? "Filtrando solo proyectos finalizados dentro del rango seleccionado" 
              : "Habilita este filtro para ver solo proyectos finalizados"}
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDateFrom}
                onChange={(e) => onEndDateFromChange(e.target.value)}
                disabled={!isEndDateFilterApplied}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={endDateTo}
                onChange={(e) => onEndDateToChange(e.target.value)}
                disabled={!isEndDateFilterApplied}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {isEndDateFilterApplied && (
                  <Chip 
                    label="Solo proyectos finalizados"
                    color="success"
                  />
                )}
                
                {isEndDateFilterApplied && endDateFrom && (
                  <Chip 
                    label={`Finalizados desde: ${formatDate(endDateFrom)}`} 
                    color="info" 
                    onDelete={() => onEndDateFromChange('')}
                    variant="outlined"
                  />
                )}
                
                {isEndDateFilterApplied && endDateTo && (
                  <Chip 
                    label={`Finalizados hasta: ${formatDate(endDateTo)}`}
                    color="info"
                    onDelete={() => onEndDateToChange('')}
                    variant="outlined"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default DateRangeFilter;