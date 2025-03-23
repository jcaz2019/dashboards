import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, SelectChangeEvent } from '@mui/material';
import { Company } from '../types/project';

interface CompanySelectorProps {
  companies: Company[];
  selectedCompany: number | null;
  onSelectCompany: (companyId: number | null) => void;
  isLoading: boolean;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({ 
  companies, 
  selectedCompany, 
  onSelectCompany, 
  isLoading 
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onSelectCompany(value === "" ? null : Number(value));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={24} />
        <span>Loading companies...</span>
      </Box>
    );
  }

  return (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel id="company-select-label">Company</InputLabel>
      <Select
        labelId="company-select-label"
        id="company-select"
        value={selectedCompany !== null ? selectedCompany.toString() : ""}
        label="Company"
        onChange={handleChange}
      >
        <MenuItem value="">All Companies</MenuItem>
        {companies.map((company) => (
          <MenuItem key={company.id} value={company.id.toString()}>
            {company.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default CompanySelector; 