import { sqliteTable, foreignKey, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const userSession = sqliteTable('user_session', {
  id: text().primaryKey().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: integer('expires_at').notNull(),
});

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .notNull()
    .references(() => user.id),
  language: text(),
});

export const user = sqliteTable(
  'user',
  {
    id: text().primaryKey().notNull(),
    name: text(),
    email: text().notNull(),
    username: text().notNull(),
    rating: integer(),
    selectedClub: text('selected_club')
      .notNull()
      .references(() => club.id),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [uniqueIndex('user_username_unique').on(table.username), uniqueIndex('user_email_unique').on(table.email)],
);

export const affiliation = sqliteTable(
  'affiliation',
  {
    id: text().primaryKey().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    clubId: text('club_id')
      .notNull()
      .references(() => club.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => player.id, { onDelete: 'cascade' }),
    status: text().notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [uniqueIndex('affiliation_user_club_unique_idx').on(table.userId, table.clubId)],
);

export const club = sqliteTable('club', {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  createdAt: integer('created_at').notNull(),
  lichessTeam: text('lichess_team'),
});

export const clubsToUsers = sqliteTable('clubs_to_users', {
  id: text().primaryKey().notNull(),
  clubId: text('club_id')
    .notNull()
    .references(() => club.id),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  status: text().notNull(),
  promotedAt: integer('promoted_at').notNull(),
});

export const game = sqliteTable('game', {
  id: text().primaryKey().notNull(),
  gameNumber: integer('game_number').notNull(),
  roundNumber: integer('round_number').notNull(),
  roundName: text('round_name'),
  whiteId: text('white_id')
    .notNull()
    .references(() => player.id),
  blackId: text('black_id')
    .notNull()
    .references(() => player.id),
  whitePrevGameId: text('white_prev_game_id'),
  blackPrevGameId: text('black_prev_game_id'),
  result: text(),
  tournamentId: text('tournament_id')
    .notNull()
    .references(() => tournament.id),
});

export const playersToTournaments = sqliteTable('players_to_tournaments', {
  id: text().primaryKey().notNull(),
  playerId: text('player_id')
    .notNull()
    .references(() => player.id),
  tournamentId: text('tournament_id')
    .notNull()
    .references(() => tournament.id),
  wins: integer().notNull(),
  losses: integer().notNull(),
  draws: integer().notNull(),
  colorIndex: integer('color_index').notNull(),
  place: integer(),
  isOut: integer('is_out'),
  pairingNumber: integer('pairing_number'),
});

export const tournament = sqliteTable('tournament', {
  id: text().primaryKey().notNull(),
  name: text(),
  format: text().notNull(),
  type: text().notNull(),
  date: text().notNull(),
  createdAt: integer('created_at').notNull(),
  clubId: text('club_id')
    .notNull()
    .references(() => club.id),
  startedAt: integer('started_at'),
  closedAt: integer('closed_at'),
  roundsNumber: integer('rounds_number'),
  ongoingRound: integer('ongoing_round').notNull(),
  rated: integer().notNull(),
});

export const player = sqliteTable(
  'player',
  {
    id: text().primaryKey().notNull(),
    nickname: text().notNull(),
    realname: text(),
    userId: text('user_id').references(() => user.id),
    rating: integer().notNull(),
    clubId: text('club_id')
      .notNull()
      .references(() => club.id),
    lastSeen: integer('last_seen'),
  },
  (table) => [
    uniqueIndex('player_user_club_unique_idx').on(table.userId, table.clubId),
    uniqueIndex('player_nickname_club_unique_idx').on(table.nickname, table.clubId),
  ],
);

export const clubNotification = sqliteTable('club_notification', {
  id: text().primaryKey().notNull(),
  createdAt: integer('created_at').notNull(),
  clubId: text('club_id')
    .notNull()
    .references(() => club.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  isSeen: integer('is_seen').notNull(),
  metadata: text(),
});

export const userNotification = sqliteTable('user_notification', {
  id: text().primaryKey().notNull(),
  createdAt: integer('created_at').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  isSeen: integer('is_seen').notNull(),
  metadata: text(),
});
