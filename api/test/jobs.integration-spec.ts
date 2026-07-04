import { getQueueToken } from '@nestjs/bullmq';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { Queue } from 'bullmq';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JobStatus, JobType, QUEUE_NAME } from '../src/jobs/job.enums';

// Integration test: boots the real Nest application against ephemeral
// Postgres + Redis containers (Testcontainers), runs migrations, and
// exercises the HTTP layer end to end (controller -> service -> DB + queue).
describe('Jobs API (integration)', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;
  let redis: StartedRedisContainer;
  let queue: Queue;

  beforeAll(async () => {
    postgres = await new PostgreSqlContainer('postgres:16')
      .withDatabase('jobs')
      .withUsername('jobs')
      .withPassword('jobs')
      .start();
    redis = await new RedisContainer('redis:7').start();

    process.env.POSTGRES_HOST = postgres.getHost();
    process.env.POSTGRES_PORT = String(postgres.getMappedPort(5432));
    process.env.POSTGRES_USER = 'jobs';
    process.env.POSTGRES_PASSWORD = 'jobs';
    process.env.POSTGRES_DB = 'jobs';
    process.env.REDIS_HOST = redis.getHost();
    process.env.REDIS_PORT = String(redis.getMappedPort(6379));

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    queue = app.get<Queue>(getQueueToken(QUEUE_NAME));
    await queue.obliterate({ force: true });
  });

  afterAll(async () => {
    await app?.close();
    await postgres?.stop();
    await redis?.stop();
  });

  it('POST /jobs persists a queued job and enqueues it (no worker processes it here)', async () => {
    const res = await request(app.getHttpServer())
      .post('/jobs')
      .send({ value: 9 })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe(JobStatus.QUEUED);
    expect(res.body.type).toBe(JobType.SQUARE);
    expect(res.body.input).toEqual({ value: 9 });

    const counts = await queue.getJobCounts('waiting', 'active', 'delayed');
    const pending =
      (counts.waiting ?? 0) + (counts.active ?? 0) + (counts.delayed ?? 0);
    expect(pending).toBeGreaterThanOrEqual(1);
  });

  it('validates the request body (rejects a missing value)', async () => {
    await request(app.getHttpServer()).post('/jobs').send({}).expect(400);
  });

  it('GET /jobs/:id returns the persisted job', async () => {
    const created = await request(app.getHttpServer())
      .post('/jobs')
      .send({ value: 4 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/jobs/${created.body.id}`)
      .expect(200);

    expect(res.body.id).toBe(created.body.id);
    expect(res.body.input).toEqual({ value: 4 });
    expect(res.body.status).toBe(JobStatus.QUEUED);
  });

  it('GET /jobs lists persisted jobs (newest first)', async () => {
    const res = await request(app.getHttpServer()).get('/jobs').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /jobs/:id returns 404 for an unknown id', async () => {
    await request(app.getHttpServer())
      .get('/jobs/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});
