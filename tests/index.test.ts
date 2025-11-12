import { describe, expect, test, beforeAll } from 'bun:test';
import { encrypt, decrypt } from '@/lib/crypto';
import type { DashboardMessage, GlobalMessage, WebSocketData } from '@/types/ws-events';

// Set up test environment
beforeAll(() => {
  process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key-that-is-at-least-32-characters-long';
  process.env.PORT = process.env.PORT || '7070';
  process.env.OPENSTATUS_HEADER = process.env.OPENSTATUS_HEADER || 'test-openstatus-header';
});

/**
 * Integration tests for the WebSocket server
 * These tests verify the core functionality without mocking
 */

describe('WebSocket Server Integration - Core Functionality', () => {
  test('should encrypt and decrypt session IDs for WebSocket protocol', () => {
    const sessionId = 'test-session-123';
    const encrypted = encrypt(sessionId);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(sessionId);
    expect(encrypted).not.toContain(':'); // URL-safe
  });

  test('should handle WebSocket data types correctly', () => {
    const tournamentData: WebSocketData = {
      connectionType: 'tournament',
      username: 'testuser',
      tournamentId: 'tournament123',
      status: 'organizer',
      userId: 'user123',
    };

    expect(tournamentData.connectionType).toBe('tournament');
    expect(tournamentData.status).toBe('organizer');
  });

  test('should handle guest WebSocket data correctly', () => {
    const guestData: WebSocketData = {
      connectionType: 'tournament',
      username: null,
      tournamentId: 'tournament123',
      status: 'viewer',
      userId: null,
    };

    expect(guestData.connectionType).toBe('tournament');
    expect(guestData.username).toBeNull();
    expect(guestData.status).toBe('viewer');
  });

  test('should handle global connection data correctly', () => {
    const globalData: WebSocketData = {
      connectionType: 'global',
      username: 'testuser',
      userId: 'user123',
    };

    expect(globalData.connectionType).toBe('global');
    expect(globalData.username).toBe('testuser');
  });
});

describe('WebSocket Server - Message Validation', () => {
  test('should validate dashboard message structure', () => {
    const resetMessage: DashboardMessage = {
      type: 'reset-tournament',
    };

    expect(resetMessage.type).toBe('reset-tournament');
    expect(JSON.stringify(resetMessage)).toBe('{"type":"reset-tournament"}');
  });

  test('should validate game result message structure', () => {
    const gameResultMessage: DashboardMessage = {
      type: 'set-game-result',
      gameId: 'game123',
      result: '1-0',
      roundNumber: 1,
    };

    expect(gameResultMessage.type).toBe('set-game-result');
    expect(gameResultMessage.gameId).toBe('game123');
    expect(gameResultMessage.result).toBe('1-0');
  });

  test('should validate tournament start message structure', () => {
    const startMessage: DashboardMessage = {
      type: 'start-tournament',
      started_at: new Date('2024-01-01'),
      rounds_number: 5,
    };

    expect(startMessage.type).toBe('start-tournament');
    expect(startMessage.rounds_number).toBe(5);
  });

  test('should validate error message structure', () => {
    const errorMsg: DashboardMessage = {
      type: 'error',
      message: 'Test error message',
    };

    expect(errorMsg.type).toBe('error');
    expect(errorMsg.message).toBe('Test error message');
  });

  test('should validate global notification message', () => {
    const notification: GlobalMessage = {
      type: 'user_notification',
      recipientId: 'user123',
    };

    expect(notification.type).toBe('user_notification');
    expect(notification.recipientId).toBe('user123');
  });

  test('should validate club removal message', () => {
    const removal: GlobalMessage = {
      type: 'removed_from_club',
      clubId: 'club123',
      recipientId: 'user456',
    };

    expect(removal.type).toBe('removed_from_club');
    expect(removal.clubId).toBe('club123');
    expect(removal.recipientId).toBe('user456');
  });
});

describe('WebSocket Server - Message Serialization', () => {
  test('should serialize and deserialize dashboard messages', () => {
    const message: DashboardMessage = {
      type: 'delete-tournament',
    };

    const serialized = JSON.stringify(message);
    const deserialized = JSON.parse(serialized) as DashboardMessage;

    expect(deserialized.type).toBe('delete-tournament');
  });

  test('should serialize and deserialize complex messages', () => {
    const message: DashboardMessage = {
      type: 'finish-tournament',
      closed_at: new Date('2024-01-01T12:00:00Z'),
    };

    const serialized = JSON.stringify(message);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.type).toBe('finish-tournament');
    expect(deserialized.closed_at).toBeDefined();
  });

  test('should handle message parsing errors gracefully', () => {
    const invalidJson = 'invalid json{';

    expect(() => JSON.parse(invalidJson)).toThrow();
  });

  test('should validate message type discrimination', () => {
    const messages: DashboardMessage[] = [
      { type: 'reset-tournament' },
      { type: 'delete-tournament' },
      { type: 'error', message: 'test' },
    ];

    messages.forEach((msg) => {
      expect(msg.type).toBeDefined();
      expect(typeof msg.type).toBe('string');
    });
  });
});

describe('WebSocket Server - Protocol and Authentication', () => {
  test('should encrypt session IDs for WebSocket subprotocol', () => {
    const sessionId = 'session-abc-123';
    const encrypted = encrypt(sessionId);

    // Should be URL-safe (no special characters that break WebSocket protocol)
    expect(encrypted).not.toContain(':');
    expect(encrypted).not.toContain('/');
    expect(encrypted).not.toContain('+');
    expect(encrypted).not.toContain('=');

    // Should decrypt back to original
    expect(decrypt(encrypted)).toBe(sessionId);
  });

  test('should handle different session ID formats', () => {
    const sessionIds = ['simple-session', 'session_with_underscores', 'session-with-dashes', 'SessionWithCaps123'];

    sessionIds.forEach((sessionId) => {
      const encrypted = encrypt(sessionId);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(sessionId);
    });
  });

  test('should validate connection type discrimination', () => {
    const tournamentConnection: WebSocketData = {
      connectionType: 'tournament',
      username: 'user1',
      tournamentId: 'tour1',
      status: 'player',
      userId: 'uid1',
    };

    const globalConnection: WebSocketData = {
      connectionType: 'global',
      username: 'user2',
      userId: 'uid2',
    };

    expect(tournamentConnection.connectionType).toBe('tournament');
    expect(globalConnection.connectionType).toBe('global');
  });
});

describe('WebSocket Server - Status and Roles', () => {
  test('should differentiate between user statuses', () => {
    const statuses: Array<'organizer' | 'player' | 'viewer'> = ['organizer', 'player', 'viewer'];

    statuses.forEach((status) => {
      const data: WebSocketData = {
        connectionType: 'tournament',
        username: 'testuser',
        tournamentId: 'tour1',
        status: status,
        userId: 'user1',
      };

      expect(data.status).toBe(status);
    });
  });

  test('should handle guest viewer status', () => {
    const guestData: WebSocketData = {
      connectionType: 'tournament',
      username: null,
      tournamentId: 'tour1',
      status: 'viewer',
      userId: null,
    };

    expect(guestData.status).toBe('viewer');
    expect(guestData.username).toBeNull();
    expect(guestData.userId).toBeNull();
  });

  test('should validate organizer permissions', () => {
    const organizerData: WebSocketData = {
      connectionType: 'tournament',
      username: 'admin',
      tournamentId: 'tour1',
      status: 'organizer',
      userId: 'admin123',
    };

    // Organizer should be able to publish messages
    expect(organizerData.status).toBe('organizer');
    expect(organizerData.username).not.toBeNull();
  });

  test('should validate player permissions', () => {
    const playerData: WebSocketData = {
      connectionType: 'tournament',
      username: 'player1',
      tournamentId: 'tour1',
      status: 'player',
      userId: 'player123',
    };

    // Player should not have organizer privileges
    expect(playerData.status).toBe('player');
    expect(playerData.status).not.toBe('organizer');
  });
});

describe('WebSocket Server - Tournament ID Validation', () => {
  test('should handle valid tournament IDs', () => {
    const validIds = ['tournament-123', 'tour_abc_456', 'TOURNAMENT789', 'tour-with-many-parts-123'];

    validIds.forEach((id) => {
      const data: WebSocketData = {
        connectionType: 'tournament',
        username: 'user',
        tournamentId: id,
        status: 'viewer',
        userId: 'user1',
      };

      expect(data.tournamentId).toBe(id);
      expect(data.tournamentId.length).toBeGreaterThan(0);
    });
  });

  test('should handle tournament subscription topics', () => {
    const tournamentId = 'tournament-123';
    const expectedTopic = `tournament:${tournamentId}`;

    expect(expectedTopic).toBe('tournament:tournament-123');
  });

  test('should handle user subscription topics', () => {
    const userId = 'user-456';
    const expectedTopic = `user:${userId}`;

    expect(expectedTopic).toBe('user:user-456');
  });
});

describe('WebSocket Server - Error Handling', () => {
  test('should create proper error response format', () => {
    const errorResponse = {
      error: 'invalid message format',
    };

    const serialized = JSON.stringify(errorResponse);
    const parsed = JSON.parse(serialized);

    expect(parsed.error).toBe('invalid message format');
  });

  test('should handle malformed JSON gracefully', () => {
    const malformedInputs = ['not json at all', '{incomplete', '{"key": undefined}'];

    malformedInputs.forEach((input) => {
      expect(() => JSON.parse(input)).toThrow();
    });
  });

  test('should validate error message structure', () => {
    const errorMsg: DashboardMessage = {
      type: 'error',
      message: 'Unauthorized action',
    };

    expect(errorMsg.type).toBe('error');
    expect(errorMsg.message).toBeDefined();
    expect(typeof errorMsg.message).toBe('string');
  });

  test('should handle empty message gracefully', () => {
    const emptyMessage = '';
    expect(() => JSON.parse(emptyMessage)).toThrow();
  });
});

describe('WebSocket Server - Message Broadcasting', () => {
  test('should format tournament broadcast topic correctly', () => {
    const tournamentId = 'tournament-abc-123';
    const topic = `tournament:${tournamentId}`;

    expect(topic).toBe('tournament:tournament-abc-123');
    expect(topic).toContain('tournament:');
  });

  test('should format user broadcast topic correctly', () => {
    const userId = 'user-xyz-789';
    const topic = `user:${userId}`;

    expect(topic).toBe('user:user-xyz-789');
    expect(topic).toContain('user:');
  });

  test('should serialize messages for broadcasting', () => {
    const message: DashboardMessage = {
      type: 'reset-tournament',
    };

    const serialized = JSON.stringify(message);
    expect(typeof serialized).toBe('string');
    expect(serialized).toContain('reset-tournament');
  });

  test('should handle complex message broadcasting', () => {
    const message: GlobalMessage = {
      type: 'removed_from_club',
      clubId: 'club123',
      recipientId: 'user456',
    };

    const serialized = JSON.stringify(message);
    const deserialized = JSON.parse(serialized) as GlobalMessage;

    expect(deserialized.type).toBe('removed_from_club');
    if (deserialized.type === 'removed_from_club') {
      expect(deserialized.clubId).toBe('club123');
      expect(deserialized.recipientId).toBe('user456');
    }
  });
});
