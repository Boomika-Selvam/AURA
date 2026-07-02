import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private socket?: Socket;

  connect() {
    this.socket = this.socket || io('https://aura-ljpr.onrender.com', { withCredentials: true });
    return this.socket;
  }

  joinSpace(spaceId: string) {
    this.connect().emit('space:join', spaceId);
  }
}
