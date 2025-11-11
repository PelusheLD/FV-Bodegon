#!/usr/bin/env node

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  // Ejecutar migraciones SQL si existen
  console.log('🔄 Ejecutando migraciones SQL...');
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    const migrationsDir = join(__dirname, '..', 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.includes('meta'))
      .sort();
    
    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const sql = readFileSync(migrationPath, 'utf8');
      
      try {
        await pool.query(sql);
        console.log(`✓ Migración ${file} ejecutada`);
      } catch (error) {
        // Ignorar errores de "already exists" o "column already exists"
        if (error.message && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate') ||
          error.message.includes('IF NOT EXISTS')
        )) {
          console.log(`⚠ Migración ${file} ya aplicada o no aplicable`);
        } else {
          console.log(`⚠ Error en migración ${file}:`, error.message);
        }
      }
    }
    
    await pool.end();
  } catch (error) {
    console.log('⚠ No se pudieron ejecutar migraciones SQL:', error.message);
  }
  
  console.log('🌱 Poblando base de datos con datos iniciales...');
  execSync('npm run seed', { stdio: 'inherit' });
  
  console.log('✅ Base de datos inicializada correctamente');
  
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('❌ Error inicializando base de datos:', errorMessage);
  // No salir con error para que el servidor pueda iniciar
  console.log('⚠️ Continuando con el inicio del servidor...');
}
