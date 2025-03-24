import { Pool } from 'pg';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Imprimir variables de entorno para depuración
console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DBT_PROFILE:', process.env.DBT_PROFILE);
console.log('DBT_TARGET:', process.env.DBT_TARGET);
console.log('DBT_TARGET_SCHEMA:', process.env.DBT_TARGET_SCHEMA);
console.log('DBT_CUSTOM_SCHEMA:', process.env.DBT_CUSTOM_SCHEMA);

// Configuración mejorada del pool
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Configuración adicional para mejorar la estabilidad
  max: 10, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que un cliente puede estar inactivo
  connectionTimeoutMillis: 10000, // tiempo máximo para establecer una conexión
  maxUses: 7500, // número máximo de usos de una conexión antes de ser cerrada y reemplazada
};

// Crear el pool con la configuración mejorada
const pool = new Pool(dbConfig);

// Manejar errores a nivel del pool
pool.on('error', (err, client) => {
  console.error('Error inesperado en el cliente de PostgreSQL:', err);
  // No cerrar el pool en caso de error para permitir reintentos
});

console.log('Database configuration:', {
  ...dbConfig,
  password: '********' // No mostrar la contraseña en los logs
});

// Prefijo base para todos los esquemas
const schemaPrefix = process.env.DBT_TARGET_SCHEMA || 'cor_bi';

// Función para generar nombres de esquema
const getSchemaName = (suffix?: string) => {
  if (!suffix) return schemaPrefix;
  return `${schemaPrefix}${suffix}`;
};

// Exportar esquemas como un objeto con métodos
export const schemas = {
  // Esquema principal
  main: schemaPrefix,
  
  // Método para obtener esquemas con sufijo
  get: getSchemaName,
  
  // Esquemas específicos predefinidos
  custom: getSchemaName('_custom_dashboards'),
  transform: getSchemaName('_transform'),
  
  // Esquema dev usando la misma lógica de concatenación
  dev: getSchemaName('_dev')
};

// Función de consulta con reintentos y monitoreo de tiempo
export async function queryWithRetry(text: string, params: any[] = [], maxRetries = 3) {
  let retries = 0;
  let lastError;
  const startTime = Date.now();

  while (retries < maxRetries) {
    try {
      const result = await pool.query(text, params);
      const executionTime = Date.now() - startTime;
      
      // Registrar tiempo de ejecución para consultas lentas
      if (executionTime > 1000) { // más de 1 segundo
        console.log(`Consulta lenta (${executionTime}ms):`, text.substring(0, 100) + '...');
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Si es un error de conexión, reintentar
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'EPIPE') {
        console.log(`Reintentando consulta después de error ${error.code}. Intento ${retries + 1} de ${maxRetries}`);
        retries++;
        // Esperar un tiempo antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      } else {
        // Si no es un error de conexión, lanzar el error inmediatamente
        throw error;
      }
    }
  }

  // Si llegamos aquí, se agotaron los reintentos
  console.error(`Se agotaron los reintentos (${maxRetries}). Último error:`, lastError);
  throw lastError;
}

export default pool; 