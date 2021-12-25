import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';
import RoomRepository from './repositories/room';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const roomRepository = new RoomRepository();

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
  },
});

server.listen(8080, () => {
  console.log('Listening on 8080');
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
  console.log(socket.handshake.address);

  socket.on('disconnect', () => {
    console.log('disconnected', socket.roomId);

    try {
      const room = roomRepository.decrementUserCount(socket.roomId);

      if (room.userCount <= 0) {
        roomRepository.destroy(socket.roomId);
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
      socket.roomId = data.roomId;

      io.to(data.roomId).emit('newUserJoined', { nickname: data.nickname });

      const room = roomRepository.findById(data.roomId);
      socket.emit('videoState', { progress: room?.progress || 0, playing: room?.playing || false });
    } catch {
      console.log('Something went wrong');
    }
  });

  socket.on('newMessage', (data) => {
    roomRepository.addMessage(data.roomId, data.message);
    io.to(data.roomId).emit('newMessage', data.message);
  });

  socket.on('changeVideo', (data) => {
    roomRepository.updateVideo(data.roomId, data.videoUrl);
    io.to(data.roomId).emit('videoChanged', data.videoUrl);
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
    roomRepository.updateCurrentPlayed(data.roomId, data.seekTo);
    io.to(data.roomId).emit('videoSeeked', data.seekTo);
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
