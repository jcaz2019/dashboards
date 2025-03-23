export interface Project {
  company_id: number;
  project_id: number;
  client_name: string;
  project_name: string;
  project_status: string;
  created_at: string;
  start_date: string;
  deadline: string;
  delivery_date: string | null;
  estimated_income: number | null;
  total_cost: number;
  absolute_margin: number;
  margin_percentage: number | null;
  income_status: string;
  cost_status: string;
  estimated_duration_workdays: number;
  real_duration_workdays: number;
  worked_hours: number;
  estimated_hours: number | null;
  remaining_hours: number | null;
  pending_tasks: number;
  completed_tasks: number;
  total_tasks: number;
  task_progress_percentage: number;
  hours_progress_percentage: number | null;
  delivery_status: string;
  deviation_days: number | null;
}

export interface Company {
  id: number;
  name: string;
}

export interface CapacityData {
  company_id: number;
  area: string;
  position: string;
  user_id: number;
  user_name: string;
  project_id: number | null;
  project_name: string;
  month: string;
  gross_capacity: number;
  license_hours: number;
  capacity: number;
  reserved_hours: number;
  is_license: number;
}

export interface TaskMetrics {
  company_id: number;
  area: string;
  position: string;
  user_id: number;
  project_name: string;
  task_name: string;
  user: string;
  day: string;
  gross_capacity: number;
  capacity: number;
  scheduled_hs: number;
}

export interface LeaveData {
  company_id: number;
  project_id: number;
  project_name: string;
  pm_name: string;
  user_id: number;
  user_name: string;
  is_pm: boolean;
  month: string;
  licencias: string;
  reserved_hours: number;
} 