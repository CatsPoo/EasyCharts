import { BadRequestException, Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app/app.module';

/** NestJS log levels ordered from least to most severe. */
const LOG_LEVEL_ORDER: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

/**
 * Returns all log levels at or above the given minimum level.
 * e.g. minLevel='warn' → ['warn', 'error', 'fatal']
 */
function levelsFromMin(minLevel: string): LogLevel[] {
  const idx = LOG_LEVEL_ORDER.indexOf(minLevel as LogLevel);
  if (idx === -1) {
    console.warn(`Unknown LOG_LEVEL "${minLevel}", falling back to "log"`);
    return LOG_LEVEL_ORDER.slice(LOG_LEVEL_ORDER.indexOf('log'));
  }
  return LOG_LEVEL_ORDER.slice(idx);
}

async function bootstrap() {
  const minLevel = process.env.LOG_LEVEL ?? 'log';
  const logLevels = levelsFromMin(minLevel);

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });

  const corsOrigin = process.env.CORS_ALLOWED_DOMAIN;
  app.enableCors({
    origin: corsOrigin ? new RegExp(`^https?://(.*\\.)?${corsOrigin.replace('.', '\\.')}$`) : false,
    credentials: true,
  });

  app.use((req: { method: any; originalUrl: any; }, res: { on: (arg0: string, arg1: () => void) => void; statusCode: any; }, next: () => void) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      // e.g., "HTTP GET /api/health 404 3ms"
      Logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`, 'HTTP');
    });
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors) => {
    Logger.error(
      'Validation errors: ' +
      JSON.stringify(errors.map(e => ({
        property: e.property,
        value: (e as any).value,
        constraints: e.constraints,
      })), null, 2)
    );
    return new BadRequestException(errors);
  },
}));

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  const port = process.env.PORT || 3000;
  await app.listen(port);


  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
