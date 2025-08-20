import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
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
