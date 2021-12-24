import { uuid } from 'uuidv4';

interface ChatMessage {
  author: string;
  content: string;
}

interface Room {
  id: string;
  name: string;
  userCount: number;
  videoUrl: string;
  messages: ChatMessage[];
}

class RoomRepository {
  private rooms: Room[];

  constructor() {
    this.rooms = [];
  }

  public index(): Room[] {
    return this.rooms;
  }

  public addMessage(roomId: string, message: ChatMessage): void {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.messages.push(message);
    } else {
      throw new Error('Not found');
    }
  }

  public findById(id: string): Room | undefined {
    const room = this.rooms.find((curRoom) => curRoom.id === id);

    return room;
  }

  public create(room: Room): Room {
    const roomWithId = {
      ...room, id: uuid(), messages: [], userCount: 0,
    };

    this.rooms.push(roomWithId);
    return roomWithId;
  }

  public destroy(roomId: string): void {
    const roomIndex = this.rooms.findIndex((curRoom) => curRoom.id === roomId);

    this.rooms.splice(roomIndex, 1);
  }

  public updateVideo(roomId: string, url: string):void {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.videoUrl = url;
    } else {
      throw new Error('Not found');
    }
  }

  public incrementUserCount(roomId: string):Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.userCount += 1;
      return room;
    }

    throw new Error('Not found');
  }

  public decrementUserCount(roomId: string):Room {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.userCount -= 1;
      return room;
    }

    throw new Error('Not found');
  }
}

export default RoomRepository;
