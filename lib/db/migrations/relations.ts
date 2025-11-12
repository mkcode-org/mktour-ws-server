import { relations } from 'drizzle-orm/relations';
import {
  user,
  userSession,
  userPreferences,
  club,
  player,
  affiliation,
  clubsToUsers,
  tournament,
  game,
  playersToTournaments,
  clubNotification,
  userNotification,
} from './schema';

export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(user, {
    fields: [userSession.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  userSessions: many(userSession),
  userPreferences: many(userPreferences),
  club: one(club, {
    fields: [user.selectedClub],
    references: [club.id],
  }),
  affiliations: many(affiliation),
  clubsToUsers: many(clubsToUsers),
  players: many(player),
  userNotifications: many(userNotification),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(user, {
    fields: [userPreferences.userId],
    references: [user.id],
  }),
}));

export const clubRelations = relations(club, ({ many }) => ({
  users: many(user),
  affiliations: many(affiliation),
  clubsToUsers: many(clubsToUsers),
  tournaments: many(tournament),
  players: many(player),
  clubNotifications: many(clubNotification),
}));

export const affiliationRelations = relations(affiliation, ({ one }) => ({
  player: one(player, {
    fields: [affiliation.playerId],
    references: [player.id],
  }),
  club: one(club, {
    fields: [affiliation.clubId],
    references: [club.id],
  }),
  user: one(user, {
    fields: [affiliation.userId],
    references: [user.id],
  }),
}));

export const playerRelations = relations(player, ({ one, many }) => ({
  affiliations: many(affiliation),
  games_blackId: many(game, {
    relationName: 'game_blackId_player_id',
  }),
  games_whiteId: many(game, {
    relationName: 'game_whiteId_player_id',
  }),
  playersToTournaments: many(playersToTournaments),
  club: one(club, {
    fields: [player.clubId],
    references: [club.id],
  }),
  user: one(user, {
    fields: [player.userId],
    references: [user.id],
  }),
}));

export const clubsToUsersRelations = relations(clubsToUsers, ({ one }) => ({
  user: one(user, {
    fields: [clubsToUsers.userId],
    references: [user.id],
  }),
  club: one(club, {
    fields: [clubsToUsers.clubId],
    references: [club.id],
  }),
}));

export const gameRelations = relations(game, ({ one }) => ({
  tournament: one(tournament, {
    fields: [game.tournamentId],
    references: [tournament.id],
  }),
  player_blackId: one(player, {
    fields: [game.blackId],
    references: [player.id],
    relationName: 'game_blackId_player_id',
  }),
  player_whiteId: one(player, {
    fields: [game.whiteId],
    references: [player.id],
    relationName: 'game_whiteId_player_id',
  }),
}));

export const tournamentRelations = relations(tournament, ({ one, many }) => ({
  games: many(game),
  playersToTournaments: many(playersToTournaments),
  club: one(club, {
    fields: [tournament.clubId],
    references: [club.id],
  }),
}));

export const playersToTournamentsRelations = relations(playersToTournaments, ({ one }) => ({
  tournament: one(tournament, {
    fields: [playersToTournaments.tournamentId],
    references: [tournament.id],
  }),
  player: one(player, {
    fields: [playersToTournaments.playerId],
    references: [player.id],
  }),
}));

export const clubNotificationRelations = relations(clubNotification, ({ one }) => ({
  club: one(club, {
    fields: [clubNotification.clubId],
    references: [club.id],
  }),
}));

export const userNotificationRelations = relations(userNotification, ({ one }) => ({
  user: one(user, {
    fields: [userNotification.userId],
    references: [user.id],
  }),
}));
