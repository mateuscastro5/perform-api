import type { Request, Response } from 'express';
import express, { type Express } from 'express';
import { json, urlencoded } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from '../src/app.module';

let cachedApp: Express | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.use(json({ limit: '8mb' }));
  app.use(urlencoded({ limit: '8mb', extended: true }));

  app.enableCors({
    origin: [
      /^http:\/\/localhost(:\d+)?$/,
      /\.vercel\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean) as Array<RegExp | string>,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  cachedApp = expressApp;
  return cachedApp;
}

export default async function handler(req: Request, res: Response) {
  const app = await bootstrap();
  return app(req, res);
}
