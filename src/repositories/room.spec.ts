import RoomRepository from './room';

const mockedRoom = () => ({
  name: 'Mocked room',
  videoUrl: 'mocked.url.com',
  id: 'mocked-uuid',
  messages: [],
  userCount: 0,
  playing: false,
  progress: 0,
  playlist: [],
});

describe('Room repository', () => {
  let roomRepository: RoomRepository;
  const getRooms = jest.fn();

  beforeEach(() => {
    roomRepository = RoomRepository.getInstance();
    Object.defineProperty(roomRepository, 'rooms', {
      get: getRooms.mockImplementation(() => ([])),
    });
  });

  it('should be able to create a new room properly', () => {
    const createdRoom = roomRepository.create(mockedRoom() as any);

    expect(createdRoom).toEqual(
      expect.objectContaining({
        ...(mockedRoom()), id: expect.any(String),
      }),
    );
  });

  it('should be able to get a created room by id', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.findById('mocked-uuid');

    expect(room).toStrictEqual(
      mockedRoom(),
    );
  });

  it('should be able to add a new message', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.addMessage('mocked-uuid', { author: 'Mocked user', content: 'Mocked content' });

    expect(room.messages).toEqual([{ author: 'Mocked user', content: 'Mocked content' }]);
  });

  it('should be able to increment userCount', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.incrementUserCount('mocked-uuid');

    expect(room.userCount).toEqual(1);
  });

  it('should be able to decrement userCount', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);

    const room = roomRepository.decrementUserCount('mocked-uuid');

    expect(room.userCount).toEqual(-1);
  });

  it('should be able to update playing progress', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.updateCurrentPlayed('mocked-uuid', 20);

    expect(room.progress).toEqual(20);
  });

  it('should be able to update video playing', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.updateVideoPlaying('mocked-uuid', true);

    expect(room.playing).toEqual(true);
  });

  it('should be able to update video url', () => {
    getRooms.mockImplementationOnce(() => [mockedRoom()]);
    const room = roomRepository.updateVideo('mocked-uuid', 'updated.video.com');

    expect(room.videoUrl).toEqual('updated.video.com');
  });

  it('should be able to destroy a room', () => {
    const rooms = [mockedRoom()] as unknown as jest.Mock;

    getRooms.mockImplementation(() => rooms);

    roomRepository.destroy('mocked-uuid');
    expect(rooms).toEqual([]);
  });
});
