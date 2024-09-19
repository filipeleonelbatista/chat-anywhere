import { Server as NetServer } from 'http';
import { Socket as NetSocket } from 'net';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';

interface SocketServer extends NetServer {
  io?: ServerIO;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface Participant {
  id: string;
  user: string;
  avatar: string;
}

const participantsByRoom: { [room: string]: Participant[] } = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = res.socket as SocketWithIO;

  if (socket.server && !socket.server.io) {
    console.log('Inicializando WebSocket');
    const io = new ServerIO(socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
      },
    });

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

      io.to(room).emit('participants', participantsByRoom[room]);

      socket.on('message', (msg) => {
        io.to(room).emit('message', msg);
      });

      socket.on('disconnect', () => {
        participantsByRoom[room] = participantsByRoom[room].filter(p => p.id !== id);
        io.to(room).emit('participants', participantsByRoom[room]);
      });
    });

    socket.server.io = io;
  } else {
    console.log('WebSocket já inicializado');
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
