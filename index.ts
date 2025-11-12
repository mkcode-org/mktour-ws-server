import { validateRequest } from '@/lib/lucia';
import { TLS } from './lib/config/tls';
import { getStatusInTournament } from './lib/get-status-in-tournament';
import { errorMessage } from './lib/ws-error-message';
import { decrypt } from './lib/crypto';
import type { DashboardMessage, GlobalMessage, Message, WebSocketData } from './types/ws-events';

const server = Bun.serve<WebSocketData, {}>({
  port: process.env.PORT || 7070,
  tls: TLS,
  async fetch(req, server) {
    const isOpenStatus = String(req.headers.get('x-openstatus')) === process.env.OPENSTATUS_HEADER;
    if (isOpenStatus) return new Response('ok', { status: 200 });

    const { pathname } = new URL(req.url);
    const protocol = req.headers.get('sec-websocket-protocol');

    if (!protocol) {
      return new Response('unauthorized', { status: 401 });
    }

    if (pathname.startsWith('/tournament')) {
      const tournamentId = pathname.replace('/tournament/', '');
      if (!tournamentId) {
        return new Response('not found', { status: 404 });
      }

      if (protocol === 'guest') {
        server.upgrade(req, {
          data: {
            connectionType: 'tournament',
            username: null,
            tournamentId,
            status: 'viewer',
            userId: null,
          },
        });
        return;
      }

      const sessionId = decrypt(protocol);
      const { user } = await validateRequest(sessionId);

      if (!user) {
        return new Response('unauthorized', { status: 401 });
      }

      const status = await getStatusInTournament(user, tournamentId);

      server.upgrade(req, {
        data: {
          connectionType: 'tournament',
          username: user.username,
          tournamentId,
          status,
          userId: user.id,
        },
      });
      return;
    }

    if (pathname.startsWith('/global')) {
      const sessionId = decrypt(protocol);
      const { user } = await validateRequest(sessionId);

      if (!user) {
        return new Response('unauthorized', { status: 401 });
      }

      server.upgrade(req, {
        data: {
          connectionType: 'global',
          username: user.username,
          userId: user.id,
        },
      });
      return;
    }

    return new Response('not found', { status: 404 });
  },
  websocket: {
    sendPings: true,
    open(ws) {
      if (ws.data.connectionType === 'tournament') {
        const username = ws.data.username ?? 'guest';
        console.log(`${username} entered tournament ${ws.data.tournamentId} as ${ws.data.status}`);
        ws.subscribe(`tournament:${ws.data.tournamentId}`);
      } else {
        console.log(`${ws.data.username} connected to global channel`);
        ws.subscribe(`user:${ws.data.userId}`);
      }
    },
    message(ws, message) {
      if (!message || message instanceof Buffer) {
        return;
      }

      try {
        const data = JSON.parse(message) as Message;
        if (ws.data.connectionType === 'tournament') {
          handleTournamentMessage(ws, data as DashboardMessage);
        } else {
          handleGlobalMessage(ws, data as GlobalMessage);
        }
      } catch {
        ws.send(JSON.stringify({ error: 'invalid message format' }));
      }
    },
    close(ws) {
      if (ws.data.connectionType === 'tournament') {
        const username = ws.data.username ?? 'guest';
        console.log(`${username} left tournament ${ws.data.tournamentId}`);
        ws.unsubscribe(`tournament:${ws.data.tournamentId}`);
      } else {
        console.log(`${ws.data.username} disconnected from global channel`);
        ws.unsubscribe(`user:${ws.data.userId}`);
      }
    },
  },
});

function handleTournamentMessage(ws: Bun.ServerWebSocket<WebSocketData>, message: DashboardMessage) {
  if (ws.data.connectionType !== 'tournament' || !ws.data.tournamentId) return;

  if (ws.data.status === 'organizer') {
    console.log(`tournament ${ws.data.tournamentId}, ${ws.data.username}: ${JSON.stringify(message)}`);
    ws.publish(`tournament:${ws.data.tournamentId}`, JSON.stringify(message));
  } else {
    ws.send(errorMessage(message));
  }
}

function handleGlobalMessage(ws: Bun.ServerWebSocket<WebSocketData>, message: GlobalMessage) {
  if (ws.data.connectionType !== 'global') return;

  console.log(`global, ${ws.data.username}: ${JSON.stringify(message)}`);
  ws.publish(`user:${message.recipientId}`, JSON.stringify(message));
}

console.log(`Listening on ${server.hostname}:${server.port}`);
console.log('supported endpoints:');
console.log('  - /tournament/{tournamentId} - for tournament connections');
console.log('  - /global - for global user-connections');
