import { Server } from 'socket.io';

export function createRealtimeServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }
  });

  io.on('connection', (socket) => {
    socket.on('space:join', (spaceId) => socket.join(`space:${spaceId}`));
    socket.on('space:leave', (spaceId) => socket.leave(`space:${spaceId}`));
    socket.on('collaboration:typing', (payload) => socket.to(`space:${payload.spaceId}`).emit('collaboration:typing', payload));
    socket.on('notification:subscribe', (userId) => socket.join(`user:${userId}`));
  });

  return io;
}
