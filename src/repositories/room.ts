import { uuid } from 'uuidv4';

interface ChatMessage {
  author: string;
  content: string;
}

interface Room {
  id: string;
  name: string;
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

  public create(room: Room): void {
    const roomWithId = { ...room, id: uuid() };

    this.rooms.push(roomWithId);
  }

  public updateVideo(roomId: string, url: string):void {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.videoUrl = url;
    } else {
      throw new Error('Not found');
    }
  }
}

export default RoomRepository;
