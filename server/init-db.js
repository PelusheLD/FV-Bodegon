#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Inicializando base de datos...');

async function runSessionMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('📋 Ejecutando migración de tabla de sesiones...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', '0008_add_session_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(sql);
    console.log('✅ Tabla de sesiones creada correctamente');
  } catch (error) {
    // Si la tabla ya existe, no es un error crítico
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error?.code;
    if (errorMessage?.includes('already exists') || errorCode === '42P07') {
      console.log('ℹ️ Tabla de sesiones ya existe, continuando...');
    } else {
      console.error('⚠️ Error ejecutando migración de sesiones:', errorMessage);
    }
  } finally {
    await client.end();
  }
}

async function initDatabase() {
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
    
    // Ejecutar migración de tabla de sesiones
    await runSessionMigration();
    
    console.log('🌱 Poblando base de datos con datos iniciales...');
    execSync('npm run seed', { stdio: 'inherit' });
    
    console.log('✅ Base de datos inicializada correctamente');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error inicializando base de datos:', errorMessage);
    // No salir con error para que el servidor pueda iniciar
    console.log('⚠️ Continuando con el inicio del servidor...');
  }
}

initDatabase();
