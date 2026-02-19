import { GameState } from './types';

export type GameMessage = 
  | { type: 'STATE_UPDATE'; payload: GameState }
  | { type: 'CLIENT_ACTION'; action: ClientAction };

export type ClientAction =
  | { type: 'JOIN'; teamId: string }
  | { type: 'UPDATE_INPUT'; teamId: string; input: string }
  | { type: 'SUBMIT_GUESS'; teamId: string };

const CHANNEL_NAME = 'glitchy_word_chaos_channel';

class GameCommunication {
  private channel: BroadcastChannel;
  private messageHandlers: ((msg: GameMessage) => void)[] = [];

  constructor() {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.channel.onmessage = (event) => {
      this.messageHandlers.forEach(handler => handler(event.data));
    };
  }

  public subscribe(handler: (msg: GameMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  public sendStateUpdate(state: GameState) {
    this.channel.postMessage({ type: 'STATE_UPDATE', payload: state });
  }

  public sendClientAction(action: ClientAction) {
    this.channel.postMessage({ type: 'CLIENT_ACTION', action });
  }

  public close() {
    this.channel.close();
  }
}

// Singleton instance
export const gameComm = new GameCommunication();
