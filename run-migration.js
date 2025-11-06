const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Leer el archivo SQL
    const fs = require('fs');
    const sql = fs.readFileSync('migration.sql', 'utf8');

    // Ejecutar el SQL
    await client.query(sql);
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();

