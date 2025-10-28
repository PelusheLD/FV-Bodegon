#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Inicializando base de datos...');

try {
  // Verificar si DATABASE_URL está disponible
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL no está configurada');
    process.exit(1);
  }

  console.log('📊 Creando tablas...');
  execSync('npm run db:push', { stdio: 'inherit' });
  
  console.log('🌱 Poblando base de datos con datos iniciales...');
  execSync('npm run seed', { stdio: 'inherit' });
  
  console.log('✅ Base de datos inicializada correctamente');
  
} catch (error) {
  console.error('❌ Error inicializando base de datos:', error.message);
  // No salir con error para que el servidor pueda iniciar
  console.log('⚠️ Continuando con el inicio del servidor...');
}
