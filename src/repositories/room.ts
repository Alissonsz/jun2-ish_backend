import { uuid } from 'uuidv4';

interface ChatMessage {
  author: string;
  content: string;
}

interface PlaylistItem {
  id: number;
  name: string;
  url: string;
}

export interface Room {
  id: string;
  name: string;
  userCount: number;
  videoUrl: string;
  messages: ChatMessage[];
  playing: boolean;
  progress: number;
  playlist: PlaylistItem[];
}

class RoomRepository {
  private rooms: Room[];

  // eslint-disable-next-line no-use-before-define
  private static instance: RoomRepository;

  private constructor() {
    this.rooms = [];
  }

  public static getInstance(): RoomRepository {
    if (RoomRepository.instance) return RoomRepository.instance;
    RoomRepository.instance = new RoomRepository();
    return RoomRepository.instance;
  }

  public index(): Room[] {
    return this.rooms;
  }

  public addMessage(roomId: string, message: ChatMessage): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.messages.push(message);
      return room;
    }
    throw new Error('Not found');
  }

  public findById(id: string): Room | undefined {
    const room = this.rooms.find((curRoom) => curRoom.id === id);
    return room;
  }

  public create(room: Room): Room {
    const roomWithId: Room = {
      ...room, id: uuid(), messages: [], userCount: 0, playing: false, progress: 0, playlist: [],
    };

    this.rooms.push(roomWithId);
    return roomWithId;
  }

  public destroy(roomId: string): void {
    const roomIndex = this.rooms.findIndex((curRoom) => curRoom.id === roomId);

    this.rooms.splice(roomIndex, 1);
  }

  public destroyAll(): void {
    this.rooms = [];
  }

  public updateVideo(roomId: string, url: string): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.videoUrl = url;
      return room;
    }
    throw new Error('Not found');
  }

  public updateVideoPlaying(roomId: string, playing: boolean): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.playing = playing;
      return room;
    }
    throw new Error('Not found');
  }

  public updateCurrentPlayed(roomId: string, progress: number): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.progress = progress;
      return room;
    }
    throw new Error('Not found');
  }

  public incrementUserCount(roomId: string): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.userCount += 1;
      return room;
    }

    throw new Error('Not found');
  }

  public decrementUserCount(roomId: string): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.userCount -= 1;
      return room;
    }

    throw new Error('Not found');
  }

  public updatePlaylist(roomId: string, playlist: PlaylistItem[]): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.playlist = playlist;
      return room;
    }

    throw new Error('Not found');
  }

  public addToPlaylist(roomId: string, item: PlaylistItem): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.playlist.push(item);
      return room;
    }

    throw new Error('Not found');
  }

  public RemoveFromPlaylist(roomId: string, item: PlaylistItem): Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      const index = room.playlist.findIndex((video) => video.id === item.id);

      room.playlist.splice(index, 1);
      return room;
    }

    throw new Error('Not found');
  }

  public RemoveFirstFromPlaylist(roomId: string): PlaylistItem | undefined {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room && room.playlist.length > 0) {
      const item = room.playlist.shift();
      return item;
    }

    throw new Error('Not found');
  }
}

export default RoomRepository;
