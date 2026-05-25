import { io, type Socket } from 'socket.io-client';
import type { GeneratedPaper } from '@/types';
import { getWsBaseUrl } from './runtime';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(getWsBaseUrl(), {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  return socket;
}

export function subscribeToAssignment(
  assignmentId: string,
  callbacks: {
    onProgress: (progress: number, message?: string) => void;
    onComplete: (paper: GeneratedPaper) => void;
    onFailed: (error: string) => void;
  },
) {
  const connection = getSocket();

  const handleProgress = (payload: { assignmentId: string; progress: number; message?: string }) => {
    if (payload.assignmentId === assignmentId) {
      callbacks.onProgress(payload.progress, payload.message);
    }
  };

  const handleComplete = (payload: { assignmentId: string; paper: GeneratedPaper }) => {
    if (payload.assignmentId === assignmentId) {
      callbacks.onComplete(payload.paper);
    }
  };

  const handleFailed = (payload: { assignmentId: string; error: string }) => {
    if (payload.assignmentId === assignmentId) {
      callbacks.onFailed(payload.error);
    }
  };

  connection.emit('subscribe:assignment', assignmentId);
  connection.on('generation:progress', handleProgress);
  connection.on('generation:complete', handleComplete);
  connection.on('generation:failed', handleFailed);

  return () => {
    connection.emit('unsubscribe:assignment', assignmentId);
    connection.off('generation:progress', handleProgress);
    connection.off('generation:complete', handleComplete);
    connection.off('generation:failed', handleFailed);
  };
}