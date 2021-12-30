import { io as Client, Socket } from 'socket.io-client';
import { Socket as ServerSocket } from 'socket.io';

import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import request from 'supertest';
import { app, io, server } from '../src/app';
import RoomRepository from '../src/repositories/room';

const mockedRoom = () => ({
  name: 'Mocked room',
  videoUrl: 'mocked.url.com',
  id: 'mocked-uuid',
  messages: [],
  userCount: 0,
  playing: false,
  progress: 0,
});

describe('Server', () => {
  let clientSocket: Socket<DefaultEventsMap, DefaultEventsMap>;
  let serverSocket: ServerSocket;

  beforeAll((done) => {
    server.listen(8080, () => {
      clientSocket = Client('http://localhost:8080');
      clientSocket.on('connect', done);

      io.on('connection', (socket) => {
        serverSocket = socket;
      });
    });
  });

  afterAll((done) => {
    server.close(done);
    clientSocket.close();
  });

  afterEach((done) => {
    serverSocket.rooms.clear();
    RoomRepository.getInstance().destroyAll();
    done();
  });

  it('should be able to create a room', async () => {
    const mockedData = { name: 'Mocked room', videoUrl: 'mocked.video.com' };
    const res = await request(app).post('/room').send(mockedData);
    expect(res.body.room).toMatchObject(mockedData);

    const repository = RoomRepository.getInstance();

    expect(repository.index()).toEqual([expect.objectContaining(mockedData)]);
  });

  it('should be able to get all rooms', async () => {
    const roomRepository = RoomRepository.getInstance();
    roomRepository.create(mockedRoom());

    const res = await request(app).get('/rooms').send();

    expect(res.body.rooms).toEqual(
      [expect.objectContaining({
        ...mockedRoom(),
        id: expect.any(String),
      })],
    );
  });

  it('should be able to get a room', async () => {
    const roomRepository = RoomRepository.getInstance();
    const room = roomRepository.create(mockedRoom());

    const res = await request(app).get(`/room/${room.id}`).send();

    expect(res.body.room).toMatchObject(
      { ...mockedRoom(), id: expect.any(String) },
    );
  });

  it('should be able to join a room', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());

    clientSocket.on('videoState', (data) => {
      expect(serverSocket.data.roomId).toEqual(room.id);
      expect(room.userCount).toEqual(1);
      expect(serverSocket.rooms.has(room.id)).toBeTruthy();
      expect(data.progress).toEqual(room.progress);
      expect(data.playing).toEqual(room.playing);
      done();
    });

    clientSocket.emit('joinRoom', { roomId: room.id, nickname: 'Iguzando' });
  });

  it('should be able to add a new message', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);

    clientSocket.on('newMessage', (message) => {
      expect(room.messages).toEqual([{ author: 'Mocked author', content: 'mocked content' }]);
      expect(message).toEqual(room.messages[room.messages.length - 1]);
      done();
    });

    clientSocket.emit('newMessage', { roomId: room.id, message: { author: 'Mocked author', content: 'mocked content' } });
  });

  it('should be able to change video', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);

    clientSocket.on('videoChanged', (videoUrl) => {
      expect(room.videoUrl).toEqual('updated.video.url');
      expect(videoUrl).toEqual(room.videoUrl);

      done();
    });

    clientSocket.emit('changeVideo', { roomId: room.id, videoUrl: 'updated.video.url' });
  });

  it('should update if video is playing and progress on videoPlayingChange event', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);

    clientSocket.on('videoPlayingChanged', (data) => {
      expect(room.playing).toEqual(true);
      expect(room.progress).toEqual(40);
      expect(data.playing).toEqual(room.playing);
      expect(data.progress).toEqual(room.progress);
      done();
    });

    clientSocket.emit('videoPlayingChanged', { roomId: room.id, playing: true, progress: 40 });
  });

  it('should be able to seek video', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);

    clientSocket.on('videoSeeked', (seekTo) => {
      expect(room.progress).toEqual(35);
      expect(seekTo).toEqual(room.progress);

      done();
    });

    clientSocket.emit('videoSeeked', { roomId: room.id, seekTo: 35 });
  });

  it('should be able to to update video progress', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);

    clientSocket.emit('playingProgress', { roomId: room.id, progress: 62 }, () => {
      expect(room.progress).toEqual(62);

      done();
    });
  });

  it('should decrement userCount on disconnect and destroy room if useCount equals to 0', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());
    serverSocket.join(room.id);
    serverSocket.data.roomId = room.id;

    serverSocket.on('disconnect', () => {
      expect(repository.findById(room.id)).toBeUndefined();
      done();
    });

    clientSocket.disconnect();
  });
});
