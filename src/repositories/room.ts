interface ChatMessage {
  author: string;
  content: string;
}

interface Room {
  id: number;
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

  public addMessage(roomId: number, message: ChatMessage): void {
    const room = this.rooms.find((curRoom) => curRoom.id === roomId);

    if (room) {
      room.messages.push(message);
    } else {
      throw new Error('Not found');
    }
  }

  public findById(id: number): Room | undefined {
    const room = this.rooms.find((curRoom) => curRoom.id === id);

    return room;
  }

  public create(room: Room): void {
    const roomWithId = { ...room, id: Math.round(Math.random() * 100) };

    this.rooms.push(roomWithId);
  }
}

export default RoomRepository;
