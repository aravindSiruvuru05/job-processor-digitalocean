import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './jobs/job.entity';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        // Managed Postgres (e.g. DigitalOcean) requires SSL. 'true' enables
        // SSL without CA verification for easy connection.
        ssl:
          config.get<string>('POSTGRES_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [Job],
        // Schema is owned and evolved by migrations (see src/migrations).
        synchronize: false,
        migrations: [__dirname + '/migrations/*.{js,ts}'],
        // Only auto-run migrations on startup in production. In other
        // environments run them explicitly via the TypeORM CLI.
        migrationsRun: config.get<string>('NODE_ENV') === 'production',
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
          username: config.get<string>('REDIS_USERNAME') || undefined,
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          // Managed Valkey/Redis requires TLS. Skip CA verification for
          // easy connection.
          tls:
            config.get<string>('REDIS_TLS') === 'true'
              ? { rejectUnauthorized: false }
              : undefined,
        },
      }),
    }),
    JobsModule,
  ],
})
export class AppModule {}
