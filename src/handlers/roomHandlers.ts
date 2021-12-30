import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import RoomRepository from '../repositories/room';
import { SocketData } from '../types';

// eslint-disable-next-line no-unused-vars
type Listener = (...args: any[]) => Promise<void>

const register = (listener: Listener) => async (...args: any[]) => {
  const fn = args?.[args.length - 1];
  await listener(...args);

  if (typeof fn === 'function') {
    fn();
  }
};

export default (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>,
  socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>,
) => {
  const roomRepository = RoomRepository.getInstance();

  console.log('Registering handlers');

  socket.on('joinRoom', register(async (data) => {
    console.log(data);
    try {
      roomRepository.incrementUserCount(data.roomId);
      socket.join(data.roomId);
      socket.data.roomId = data.roomId;

      io.to(data.roomId).emit('newUserJoined', { nickname: data.nickname });

      const room = roomRepository.findById(data.roomId);
      socket.emit('videoState', { progress: room?.progress || 0, playing: room?.playing || false });
    } catch {
      console.log('Something went wrong joinRoom');
    }
  }));

  socket.on('newMessage', register(async (data) => {
    try {
      roomRepository.addMessage(data.roomId, data.message);
      io.to(data.roomId).emit('newMessage', data.message);
    } catch {
      console.log('Something went wrong newMessage');
    }
  }));

  socket.on('changeVideo', register(async (data) => {
    try {
      console.log('games');
      roomRepository.updateVideo(data.roomId, data.videoUrl);
      roomRepository.updateCurrentPlayed(data.roomId, 0);
      io.to(data.roomId).emit('videoChanged', data.videoUrl);
      console.log('gameplay');
    } catch {
      console.log('Something went wrong changeVideo');
    }
  }));

  socket.on('videoPlayingChanged', register(async (data) => {
    console.log('videoPlayingChanged', data);
    try {
      roomRepository.updateVideoPlaying(data.roomId, data.playing);
      roomRepository.updateCurrentPlayed(data.roomId, data.progress);
      io.to(data.roomId).emit('videoPlayingChanged', { playing: data.playing, progress: data.progress });
    } catch {
      console.log('Something went wrong videoPlayingChanged');
    }
  }));

  socket.on('videoSeeked', register(async (data) => {
    console.log('videoSeeked', data);
    try {
      roomRepository.updateCurrentPlayed(data.roomId, data.seekTo);
      io.to(data.roomId).emit('videoSeeked', data.seekTo);
    } catch {
      console.log('Something went wrong videoSeeked');
    }
  }));

  socket.on('playingProgress', register(async (data) => {
    try {
      roomRepository.updateCurrentPlayed(data.roomId, data.progress);
    } catch {
      console.log('Something went wrong playingProgress');
    }
  }));

  socket.on('disconnect', register(async () => {
    console.log('disconnected', socket.data.roomId);

    try {
      const room = roomRepository.decrementUserCount(socket.data.roomId!);

      if (room.userCount <= 0) {
        roomRepository.destroy(socket.data.roomId!);
        console.log('Room destroyed');
      }
    } catch {
      console.log('Something went wrong disconnect');
    }
  }));
};
