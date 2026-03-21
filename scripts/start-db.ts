import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'fs';

const pg = new EmbeddedPostgres({
  databaseDir: './data/pg',
  user: 'postgres',
  password: 'postgres',
  port: 5432,
  persistent: true,
});

async function main() {
  console.log('Starting embedded PostgreSQL on port 5432...');
  const dataExists = existsSync('./data/pg/PG_VERSION');
  if (!dataExists) {
    console.log('Initializing new data directory...');
    await pg.initialise();
  } else {
    console.log('Data directory already exists, skipping init.');
  }
  await pg.start();
  console.log('PostgreSQL started successfully!');

  // Create the spirulina database if it doesn't exist
  try {
    await pg.createDatabase('spirulina');
    console.log('Database "spirulina" created.');
  } catch {
    console.log('Database "spirulina" already exists.');
  }

  console.log('');
  console.log('Connection URL: postgresql://postgres:postgres@localhost:5432/spirulina');
  console.log('');
  console.log('Press Ctrl+C to stop the database.');

  // Keep the process alive
  process.on('SIGINT', async () => {
    console.log('\nStopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await pg.stop();
    process.exit(0);
  });

  // Keep alive
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error('Failed to start PostgreSQL:', err);
  process.exit(1);
});
