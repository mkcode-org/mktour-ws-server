import { validateRequest } from '@/lib/lucia';

import { TLS } from './lib/config/tls';
import { getStatusInTournament } from './lib/get-status-in-tournament';

import type { Status } from './lib/get-status-in-tournament';
import { errorMessage } from './lib/ws-error-message';
import type {
  ConnectionType,
  DashboardMessage,
  GlobalMessage,
  Message,
  WebSocketData,
} from './types/ws-events';
import { decrypt } from './lib/crypto';

const server = Bun.serve<WebSocketData, {}>({
  port: process.env.PORT || 7070,
  tls: TLS,
  async fetch(req, server) {
    const url = new URL(req.url);
    const session = decrypt(String(req.headers.get('sec-websocket-protocol')));
    const isOpenStatus =
      String(req.headers.get('x-openstatus')) === process.env.OPENSTATUS_HEADER;
    if (isOpenStatus) return new Response('ok', { status: 200 });
    const { user } = await validateRequest(session ?? '');

    if (!user) {
      return new Response('unauthorized', { status: 401 });
    }

    const path = url.pathname;

    let connectionType: ConnectionType;
    let tournamentId: string | undefined;
    let status: Status | undefined;

    if (path.startsWith('/tournament')) {
      connectionType = 'tournament';
      tournamentId = path.replace('/tournament/', '');
      status = await getStatusInTournament(user, tournamentId);
    } else if (path.startsWith('/global')) {
      connectionType = 'global';
    } else {
      return new Response('not found', { status: 404 });
    }

    server.upgrade(req, {
      data: {
        connectionType,
        username: user.username,
        tournamentId,
        status,
        userId: user.id,
      },
    });

    return new Response(JSON.stringify(req.headers), {
      headers: { 'Content-Type': 'text/json' },
    });
  },
  websocket: {
    sendPings: true,
    open(ws) {
      if (ws.data.connectionType === 'tournament') {
        const msg = `${ws.data.username} has entered tournament ${ws.data.tournamentId}. status: ${ws.data.status}`;
        console.log(msg);
        ws.subscribe(`tournament:${ws.data.tournamentId}`);
      } else if (ws.data.connectionType === 'global') {
        const msg = `${ws.data.username} has connected to global channel`;
        console.log(msg);
        ws.subscribe(`user:${ws.data.userId}`);
      }
    },
    message(ws, message) {
      if (!message) {
        ws.send('');
        return;
      }

      if (message instanceof Buffer) return;

      try {
        const data = JSON.parse(message) as Message;
        if (ws.data.connectionType === 'tournament') {
          handleTournamentMessage(ws, data as DashboardMessage);
        } else if (ws.data.connectionType === 'global') {
          handleGlobalMessage(ws, data as GlobalMessage);
        }
      } catch (error) {
        console.error('failed to parse message:', error);
        ws.send(JSON.stringify({ error: 'invalid message format' }));
      }
    },
    close(ws) {
      if (ws.data.connectionType === 'tournament') {
        const msg = `${ws.data.username} has left tournament ${ws.data.tournamentId}`;
        console.log(msg);
        ws.unsubscribe(`tournament:${ws.data.tournamentId}`);
      } else if (ws.data.connectionType === 'global') {
        const msg = `${ws.data.username} has disconnected from global channel`;
        console.log(msg);
        ws.unsubscribe(`user:${ws.data.userId}`);
      }
    },
  },
});

function handleTournamentMessage(
  ws: Bun.ServerWebSocket<WebSocketData>,
  message: DashboardMessage,
) {
  if (ws.data.connectionType !== 'tournament' || !ws.data.tournamentId) return;

  if (ws.data.status === 'organizer') {
    console.log(
      `tournament ${ws.data.tournamentId}, ${ws.data.username}: ${JSON.stringify(message)}`,
    );
    ws.publish(`tournament:${ws.data.tournamentId}`, JSON.stringify(message));
  } else {
    ws.send(errorMessage(message));
  }
}

function handleGlobalMessage(
  ws: Bun.ServerWebSocket<WebSocketData>,
  message: GlobalMessage,
) {
  if (ws.data.connectionType !== 'global') return;

  console.log(`global, ${ws.data.username}: ${JSON.stringify(message)}`);
  ws.publish(`user:${message.recipientId}`, JSON.stringify(message));
}

console.log(`Listening on ${server.hostname}:${server.port}`);
console.log('supported endpoints:');
console.log('  - /tournament/{tournamentId} - for tournament connections');
console.log('  - /global - for global user-connections');
