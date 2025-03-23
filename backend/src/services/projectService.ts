import pool, { queryWithRetry, schemas } from '../config/db';

export const getProjectMetrics = async () => {
  try {
    const result = await queryWithRetry(`
      SELECT * FROM ${schemas.main}.avance_proyectos
      ORDER BY company_id, client_name, project_name
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching project metrics:', error);
    throw error;
  }
};

export const getProjectsByCompany = async (companyId: number) => {
  try {
    const result = await queryWithRetry(`
      SELECT * FROM ${schemas.main}.avance_proyectos
      WHERE company_id = $1
      ORDER BY client_name, project_name
    `, [companyId]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching projects for company ${companyId}:`, error);
    throw error;
  }
};

export const getCompanies = async () => {
  try {
    const result = await queryWithRetry(`
      SELECT id, name FROM cor_bi.active_companies
      ORDER BY name
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

export const getCapacityData = async (companyId?: number) => {
  try {
    const query = `
      SELECT * FROM cor_bi.matview_2y_capacity_datamart
      ${companyId ? 'WHERE company_id = $1' : ''}
      ORDER BY company_id, user_name, month
    `;
    
    const params = companyId ? [companyId] : [];
    const result = await queryWithRetry(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching capacity data:', error);
    throw error;
  }
}; 