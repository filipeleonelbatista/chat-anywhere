import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface Participant {
  id: string;
  user: string;
  avatar: string;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: '/api/socket',
  cors: {
    origin: '*',
  },
});

const participantsByRoom: { [room: string]: Participant[] } = {};

io.on('connection', (socket) => {
  const room = socket.handshake.query.room as string;
  const user = socket.handshake.query.user as string;
  const avatar = socket.handshake.query.avatar as string;
  const id = socket.handshake.query.id as string;

  socket.join(room);

  if (!participantsByRoom[room]) {
    participantsByRoom[room] = [];
  }

  const newParticipant: Participant = { id, user, avatar };
  participantsByRoom[room].push(newParticipant);

  io.to(room).emit('user_joined', { id, user, avatar });

  io.to(room).emit('participants', participantsByRoom[room]);

  socket.on('message', (msg) => {
    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    participantsByRoom[room] = participantsByRoom[room].filter(p => p.id !== id);
    io.to(room).emit('user_left', { id, user, avatar });
    io.to(room).emit('participants', participantsByRoom[room]);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
