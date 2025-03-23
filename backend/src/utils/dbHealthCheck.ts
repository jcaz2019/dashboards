import pool, { queryWithRetry } from '../config/db';

// Función para verificar la salud de la conexión a la base de datos
export async function checkDatabaseHealth() {
  try {
    const result = await queryWithRetry('SELECT 1 as health_check');
    return result.rows[0].health_check === 1;
  } catch (error) {
    console.error('Error en la verificación de salud de la base de datos:', error);
    return false;
  }
}

// Verificar la conexión periódicamente
export function startDatabaseHealthCheck(intervalMs = 60000) {
  // Verificar inmediatamente al iniciar
  checkDatabaseHealth()
    .then(isHealthy => {
      console.log(`Estado inicial de la base de datos: ${isHealthy ? 'Saludable' : 'No saludable'}`);
    })
    .catch(err => {
      console.error('Error en la verificación inicial de la base de datos:', err);
    });

  // Configurar verificación periódica
  const interval = setInterval(async () => {
    try {
      const isHealthy = await checkDatabaseHealth();
      console.log(`Verificación periódica de la base de datos: ${isHealthy ? 'Saludable' : 'No saludable'}`);
      
      // Si la base de datos no está saludable, podríamos tomar acciones adicionales aquí
      if (!isHealthy) {
        console.log('Intentando restablecer el pool de conexiones...');
        // Aquí podrías implementar lógica para reiniciar el pool si es necesario
      }
    } catch (error) {
      console.error('Error en la verificación periódica de la base de datos:', error);
    }
  }, intervalMs);

  return interval;
} 