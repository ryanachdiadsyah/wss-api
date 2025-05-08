const { exec } = require('child_process');
const { Client } = require('pg');
require('dotenv').config();

// Parse DATABASE_URL
const dbUrlRegex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
const match = process.env.DATABASE_URL.match(dbUrlRegex);

if (!match) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, dbName] = match;

// Connect to postgres database to check if our database exists
const client = new Client({
  user,
  password,
  host,
  port,
  database: 'postgres'
});

async function initDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [dbName]);

    if (result.rows.length === 0) {
      console.log(`Database ${dbName} does not exist, creating...`);
      
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created successfully`);
      
      // Run migrations
      console.log('Running Prisma migrations...');
      exec('npx prisma migrate dev --name init', (error, stdout, stderr) => {
        if (error) {
          console.error(`Error running migrations: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Migration stderr: ${stderr}`);
          return;
        }
        console.log(`Migration stdout: ${stdout}`);
        console.log('Database initialization completed successfully');
      });
    } else {
      console.log(`Database ${dbName} already exists`);
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await client.end();
  }
}

initDatabase();
