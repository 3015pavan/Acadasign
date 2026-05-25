import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { connectRedis } from './config/redis';
import { initializeSocket } from './config/socket';
import { assignmentsRouter } from './routes/assignments';
import { resultsRouter } from './routes/results';
import { pdfRouter } from './routes/pdf';
import { usersRouter } from './routes/users';
import { authRouter } from './routes/auth';
import { startGenerationWorker } from './workers/generationWorker';

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const app = express();
  // Allow the configured frontend origin, localhost dev origins, and any Vercel preview/prod origin.
  const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser requests like curl/postman (no origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
        return callback(new Error('CORS policy: Origin not allowed'));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 30 }));

  app.get('/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/api/assignments', assignmentsRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/results', resultsRouter);
  app.use('/api/pdf', pdfRouter);

  app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({ success: false, error: error.message });
  });

  const server = http.createServer(app);
  initializeSocket(server);
  startGenerationWorker();

  server.listen(env.PORT, () => {
    console.log(`VedaAI backend listening on port ${env.PORT}`);
  });
}

void bootstrap();