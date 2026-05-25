import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from './env';

let ioInstance: Server | null = null;

export function initializeSocket(server: HttpServer) {
  if (ioInstance) {
    return ioInstance;
  }

  const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:3001', 'http://127.0.0.1:3001'];

  ioInstance = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Socket CORS origin not allowed'));
      },
      credentials: true,
    },
  });

  ioInstance.on('connection', (socket) => {
    socket.on('subscribe:assignment', (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
    });

    socket.on('unsubscribe:assignment', (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  return ioInstance;
}

export function getSocketServer() {
  if (!ioInstance) {
    throw new Error('Socket server has not been initialized');
  }

  return ioInstance;
}