import { DataSource } from 'typeorm';
import { Job } from './jobs/job.entity';

// Standalone DataSource used by the TypeORM CLI (migration generate/run/revert).
// The API is the single owner of the database schema; the worker never
// creates or migrates the schema.
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : 5432,
  username: process.env.POSTGRES_USER ?? 'jobs',
  password: process.env.POSTGRES_PASSWORD ?? 'jobs',
  database: process.env.POSTGRES_DB ?? 'jobs',
  ssl:
    process.env.POSTGRES_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  entities: [Job],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
});

export default AppDataSource;
