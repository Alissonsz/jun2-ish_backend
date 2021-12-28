import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import RoomRepository from './repositories/room';
import { SocketData } from './types';

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_URL = process.env.CLIENT_URL || 'localhost:3000';

const server = createServer(app);
const roomRepository = new RoomRepository();

const io = new Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(server, {
  cors: {
    origin: [CLIENT_URL],
  },
});

server.listen(process.env.PORT || 8080, () => {
  console.log('Server listening 🚀');
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

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('disconnected', socket.data.roomId);

    try {
      const room = roomRepository.decrementUserCount(socket.data.roomId!);

      if (room.userCount <= 0) {
        roomRepository.destroy(socket.data.roomId!);
        console.log('Room destroyed');
      }
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('joinRoom', (data) => {
    try {
      roomRepository.incrementUserCount(data.roomId);
      socket.join(data.roomId);
      socket.data.roomId = data.roomId;

      io.to(data.roomId).emit('newUserJoined', { nickname: data.nickname });

      const room = roomRepository.findById(data.roomId);
      socket.emit('videoState', { progress: room?.progress || 0, playing: room?.playing || false });
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('newMessage', (data) => {
    try {
      roomRepository.addMessage(data.roomId, data.message);
      io.to(data.roomId).emit('newMessage', data.message);
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('changeVideo', (data) => {
    try {
      roomRepository.updateVideo(data.roomId, data.videoUrl);
      roomRepository.updateCurrentPlayed(data.roomId, 0);
      io.to(data.roomId).emit('videoChanged', data.videoUrl);
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('videoPlayingChanged', (data) => {
    console.log('videoPlayingChanged', data);
    try {
      roomRepository.updateVideoPlaying(data.roomId, data.playing);
      io.to(data.roomId).emit('videoPlayingChanged', data.playing);
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('videoSeeked', (data) => {
    console.log('videoSeeked', data);
    try {
      roomRepository.updateCurrentPlayed(data.roomId, data.seekTo);
      io.to(data.roomId).emit('videoSeeked', data.seekTo);
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('playingProgress', (data) => {
    console.log('playingProgress', data);

    try {
      roomRepository.updateCurrentPlayed(data.roomId, data.progress);
    } catch {
      console.log('Something went wrong');
    }
  });
});
