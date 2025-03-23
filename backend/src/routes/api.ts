import express, { Request, Response } from 'express';
import pool, { schemas, queryWithRetry } from '../config/db';

const router = express.Router();

// Basic route for testing
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is working' });
});

// Añadir un nuevo endpoint para obtener datos de tareas
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId;
    const limit = parseInt(req.query.limit as string) || 100; // Permitir personalizar el límite
    
    let query = `
      SELECT * FROM ${schemas.main}.planner_metrics_datamart_by_task
    `;
    
    // Añadir filtro por compañía si se proporciona
    if (companyId) {
      query += ` WHERE company_id = $1`;
    }
    
    // Añadir ordenamiento y límite
    query += ` ORDER BY day DESC LIMIT ${limit}`;
    
    console.log('Executing query:', query);
    console.log('Company ID:', companyId);
    console.log('Limit:', limit);
    
    const result = await queryWithRetry(
      query,
      companyId ? [companyId] : []
    );
    
    console.log('Query result rows:', result.rows.length);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching task data:', error);
    res.status(500).json({ error: 'Failed to fetch task data', details: error.message });
  }
});

// Endpoint de prueba para verificar la conexión a la base de datos
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Conexión a la base de datos exitosa', 
      timestamp: result.rows[0].now 
    });
  } catch (error: any) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al conectar a la base de datos', 
      error: error.message 
    });
  }
});

// Endpoint para verificar si el modelo dbt existe
router.get('/check-model', async (req: Request, res: Response) => {
  try {
    const schema = process.env.DBT_TARGET_SCHEMA || 'cor_bi';
    const modelName = 'planner_metrics_datamart_by_task';
    
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1
        AND table_name = $2
      );
    `;
    
    const result = await pool.query(query, [schema, modelName]);
    
    if (result.rows[0].exists) {
      // Si el modelo existe, obtener el número de filas
      const countQuery = `SELECT COUNT(*) FROM ${schema}.${modelName}`;
      const countResult = await pool.query(countQuery);
      
      res.json({
        success: true,
        message: `El modelo ${schema}.${modelName} existe`,
        rowCount: parseInt(countResult.rows[0].count)
      });
    } else {
      res.json({
        success: false,
        message: `El modelo ${schema}.${modelName} no existe`
      });
    }
  } catch (error: any) {
    console.error('Error al verificar el modelo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el modelo',
      error: error.message
    });
  }
});

// Endpoint básico para pruebas
router.get('/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello, world!' });
});

// Endpoint para obtener datos de licencias y horas planificadas
router.get('/leaves', async (req: Request, res: Response) => {
  try {
    // Temporalmente, usar siempre la compañía 4195
    const companyId = 4195; // Hardcodeado temporalmente
    
    // Usar directamente la tabla correcta
    const viewName = 'llyc_leaves_main_query_view';
    const schemaName = schemas.get('_custom_dashboards');
    
    let query = `
      SELECT *
      FROM ${schemaName}.${viewName}
      WHERE company_id = $1
      ORDER BY month DESC, user_name
    `;
    
    console.log('Executing leaves query:', query);
    console.log('Company ID:', companyId);
    
    const result = await queryWithRetry(
      query,
      [companyId]
    );
    
    console.log('Leaves query result rows:', result.rows.length);
    
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching leaves data:', error);
    res.status(500).json({ error: 'Failed to fetch leaves data', details: error.message });
  }
});

// Endpoint para verificar las vistas disponibles en el esquema
router.get('/check-views', async (req: Request, res: Response) => {
  try {
    const schema = req.query.schema as string || schemas.get('_custom_dashboards');
    const pattern = req.query.pattern as string || '%';
    
    const query = `
      SELECT table_name, table_schema
      FROM information_schema.views 
      WHERE table_schema = $1
      AND table_name LIKE $2
    `;
    
    const result = await pool.query(query, [schema, pattern]);
    
    res.json({
      success: true,
      schema: schema,
      views: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error checking views:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking views',
      error: error.message
    });
  }
});

// Endpoint para verificar la estructura de una tabla o vista
router.get('/check-structure', async (req: Request, res: Response) => {
  try {
    const schema = req.query.schema as string || schemas.get('_custom_dashboards');
    const table = req.query.table as string || 'llyc_leaves_main_query_view';
    
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(query, [schema, table]);
    
    // También obtener una muestra de datos
    let sampleData = [];
    try {
      const sampleQuery = `
        SELECT * FROM ${schema}.${table} LIMIT 5
      `;
      const sampleResult = await pool.query(sampleQuery);
      sampleData = sampleResult.rows;
    } catch (e) {
      console.error('Error getting sample data:', e);
    }
    
    res.json({
      success: true,
      schema: schema,
      table: table,
      columns: result.rows,
      columnCount: result.rows.length,
      sampleData: sampleData
    });
  } catch (error: any) {
    console.error('Error checking structure:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking structure',
      error: error.message
    });
  }
});

// Endpoint temporal con datos de ejemplo para licencias
router.get('/leaves-mock', async (req: Request, res: Response) => {
  // Datos de ejemplo
  const mockData = [
    {
      company_id: 4195,
      project_id: 12345,
      project_name: "Proyecto A",
      pm_name: "Juan Pérez",
      user_id: 101,
      user_name: "Ana García",
      is_pm: false,
      month: "2023-10",
      licencias: "[2,3,15-18]",
      reserved_hours: 24.5
    },
    {
      company_id: 4195,
      project_id: 12346,
      project_name: "Proyecto B",
      pm_name: "Juan Pérez",
      user_id: 101,
      user_name: "Ana García",
      is_pm: false,
      month: "2023-10",
      licencias: "[2,3,15-18]",
      reserved_hours: 16.0
    },
    // Añadir más datos de ejemplo...
  ];
  
  // Filtrar por compañía si se proporciona
  const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
  const filteredData = companyId 
    ? mockData.filter(item => item.company_id === companyId)
    : mockData;
  
  res.json(filteredData);
});

// Endpoint con paginación para datos de capacidad
router.get('/capacity-paginated', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const offset = (page - 1) * pageSize;
    
    // Consulta para obtener el total de registros
    let countQuery = `
      SELECT COUNT(*) FROM cor_bi.matview_2y_capacity_datamart
      ${companyId ? 'WHERE company_id = $1' : ''}
    `;
    
    const countResult = await queryWithRetry(
      countQuery,
      companyId ? [companyId] : []
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Consulta para obtener los datos paginados
    let dataQuery = `
      SELECT * FROM cor_bi.matview_2y_capacity_datamart
      ${companyId ? 'WHERE company_id = $1' : ''}
      ORDER BY company_id, user_name, month
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    
    const dataResult = await queryWithRetry(
      dataQuery,
      companyId ? [companyId] : []
    );
    
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Error fetching paginated capacity data:', error);
    res.status(500).json({ error: 'Failed to fetch capacity data', details: error.message });
  }
});

// Endpoint para buscar una tabla en todos los esquemas
router.get('/find-table', async (req: Request, res: Response) => {
  try {
    const tableName = req.query.table as string || 'avance_proyectos';
    
    const query = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = $1
      ORDER BY table_schema
    `;
    
    const result = await queryWithRetry(query, [tableName]);
    
    if (result.rows.length > 0) {
      res.json({
        success: true,
        message: `La tabla '${tableName}' se encontró en los siguientes esquemas:`,
        locations: result.rows
      });
    } else {
      res.json({
        success: false,
        message: `No se encontró ninguna tabla con el nombre '${tableName}'`
      });
    }
  } catch (error: any) {
    console.error('Error buscando tabla:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar la tabla',
      error: error.message
    });
  }
});

// Endpoint para verificar la estructura de la tabla de licencias
router.get('/check-leaves-table', async (req: Request, res: Response) => {
  try {
    const schemaName = schemas.get('_custom_dashboards');
    const tableName = 'llyc_leaves_main_query_view';
    
    // Verificar si la tabla existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1
        AND table_name = $2
      );
    `;
    
    const tableCheck = await queryWithRetry(checkTableQuery, [schemaName, tableName]);
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return res.json({
        success: false,
        message: `La tabla ${schemaName}.${tableName} no existe`
      });
    }
    
    // Obtener la estructura de la tabla
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
      ORDER BY ordinal_position
    `;
    
    const columnsResult = await queryWithRetry(columnsQuery, [schemaName, tableName]);
    
    // Obtener una muestra de datos
    const sampleQuery = `
      SELECT * FROM ${schemaName}.${tableName} LIMIT 5
    `;
    
    const sampleResult = await queryWithRetry(sampleQuery);
    
    res.json({
      success: true,
      message: `La tabla ${schemaName}.${tableName} existe`,
      columns: columnsResult.rows,
      sampleData: sampleResult.rows,
      rowCount: sampleResult.rows.length
    });
  } catch (error: any) {
    console.error('Error checking leaves table:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking leaves table',
      error: error.message
    });
  }
});

// Endpoint para crear la vista de licencias si no existe
router.post('/create-leaves-view', async (req: Request, res: Response) => {
  try {
    const schemaName = schemas.get('_custom_dashboards');
    const viewName = 'llyc_leaves_main_query_view';
    const backupTable = 'llyc_leaves_bkp';
    
    // Verificar si la tabla de respaldo existe
    const checkBackupQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = $1
        AND table_name = $2
      );
    `;
    
    const backupCheck = await queryWithRetry(checkBackupQuery, [schemaName, backupTable]);
    const backupExists = backupCheck.rows[0].exists;
    
    if (!backupExists) {
      return res.status(404).json({
        success: false,
        message: `La tabla de respaldo ${schemaName}.${backupTable} no existe`
      });
    }
    
    // Obtener las columnas de la tabla de respaldo
    const columnsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = $1
      AND table_name = $2
    `;
    
    const columnsResult = await queryWithRetry(columnsQuery, [schemaName, backupTable]);
    const availableColumns = columnsResult.rows.map(row => row.column_name);
    
    // Construir la consulta para crear la vista
    const createViewQuery = `
      CREATE OR REPLACE VIEW ${schemaName}.${viewName} AS
      SELECT 
        ${availableColumns.includes('company_id') ? 'company_id,' : 'NULL as company_id,'}
        ${availableColumns.includes('project_id') ? 'project_id,' : 'NULL as project_id,'}
        ${availableColumns.includes('project_name') ? 'project_name,' : '\'Sin proyecto\' as project_name,'}
        NULL as pm_name,
        ${availableColumns.includes('user_id') ? 'user_id,' : 'NULL as user_id,'}
        ${availableColumns.includes('user_name') ? 'user_name,' : '\'Usuario desconocido\' as user_name,'}
        false as is_pm,
        ${availableColumns.includes('month') ? 'month,' : '\'2023-01\' as month,'}
        ${availableColumns.includes('licencias') ? 'licencias,' : '\'\' as licencias,'}
        ${availableColumns.includes('reserved_hours') ? 'reserved_hours' : '0 as reserved_hours'}
      FROM ${schemaName}.${backupTable}
    `;
    
    await queryWithRetry(createViewQuery);
    
    res.json({
      success: true,
      message: `Vista ${schemaName}.${viewName} creada correctamente`,
      query: createViewQuery
    });
  } catch (error: any) {
    console.error('Error creating leaves view:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating leaves view',
      error: error.message
    });
  }
});

export default router; 