import express from 'express';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import RoomRepository from './repositories/room';
import { SocketData } from './types';
import registerRoomHandelers from './handlers/roomHandlers';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const server = createServer(app);
const roomRepository = RoomRepository.getInstance();

const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server, {
  cors: {
    origin: [CLIENT_URL],
  },
});

app.get('/rooms', (req, res) => {
  const rooms = roomRepository.index();
  return res.json({
    rooms,
  });
});

app.post('/room', (req, res) => {
  const room = req.body;

  const createdRoom = roomRepository.create(room);

  return res.json({
    room: createdRoom,
  });
});

app.get('/room/:id', (req, res) => {
  const { id } = req.params;

  const room = roomRepository.findById(id);

  if (room !== undefined) {
    return res.json({
      room,
    });
  }
  return res.sendStatus(404);
});

// eslint-disable-next-line max-len
const onConnection = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>) => {
  registerRoomHandelers(io, socket);
};

io.on('connection', onConnection);

export { app, io, server };
