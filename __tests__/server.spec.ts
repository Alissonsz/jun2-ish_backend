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

  it('should be able to create a room', async () => {
    const mockedData = { name: 'Mocked room', videoUrl: 'mocked.video.com' };
    const res = await request(app).post('/room').send(mockedData);
    expect(res.body.room).toMatchObject(mockedData);

    const repository = RoomRepository.getInstance();

    expect(repository.index()).toEqual([expect.objectContaining(mockedData)]);
  });

  it('should be able to join a room', (done) => {
    const repository = RoomRepository.getInstance();
    const room = repository.create(mockedRoom());

    serverSocket.on('joinRoom', () => {
      expect(serverSocket.data.roomId).toEqual(room.id);
      expect(room.userCount).toEqual(1);
      done();
    });

    clientSocket.emit('joinRoom', { roomId: room.id, nickname: 'Iguzando' });
  });
});
