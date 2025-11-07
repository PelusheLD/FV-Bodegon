#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Inicializando base de datos...');

try {
  // Verificar si DATABASE_URL está disponible
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL no está configurada');
    process.exit(1);
  }

  // Agregar parámetros SSL a la URL para producción
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbUrl.searchParams.set('sslmode', 'require');
    process.env.DATABASE_URL = dbUrl.toString();
    console.log('🔒 Configurando SSL para producción...');
  }

  console.log('📊 Creando tablas...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('🌱 Poblando base de datos con datos iniciales...');
  execSync('npm run seed', { stdio: 'inherit' });
  
  console.log('✅ Base de datos inicializada correctamente');
  
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Error inicializando base de datos:', errorMessage);
  // No salir con error para que el servidor pueda iniciar
  console.log('⚠️ Continuando con el inicio del servidor...');
}
