import { PlayerModel, Result } from '@/types/tournaments';

type DashboardMessage =
  | { type: 'add-existing-player'; body: PlayerModel }
  | { type: 'add-new-player'; body: PlayerModel }
  | { type: 'remove-player'; id: string } // onError add-exidsting-player
  | {
      type: 'set-game-result';
      gameId: string;
      result: Result;
      roundNumber: number;
    }
  | { type: 'start-tournament'; started_at: Date; rounds_number: number }
  | { type: 'reset-tournament' }
  | {
      type: 'new-round';
      roundNumber: number;
      newGames: GameModel[];
      isTournamentGoing: boolean;
    }
  | { type: 'finish-tournament'; closed_at: Date }
  | { type: 'delete-tournament' }
  | ErrorMessage;

type ErrorMessage = {
  type: 'error';
  message: string;
};

type GlobalMessage =
  | { type: 'user_notification'; userId: string }
  | { type: 'removed_from_club'; clubId: string; userId: string }
  | ErrorMessage;

type ConnectionType = 'tournament' | 'global';

type WebSocketData =
  | {
      connectionType: 'tournament';
      username: string;
      tournamentId: string;
      status: Status;
      userId: string;
    }
  | {
      connectionType: 'global';
      username: string;
      userId: string;
    };

type Message = DashboardMessage | GlobalMessage;
