import { adapter } from '@/lib/lucia-adapter';
import type { DatabaseUser } from '@/types/tournaments';
import { Lucia } from 'lucia';

import type { Session, User } from 'lucia';

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === 'production',
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      name: attributes.name,
      email: attributes.email,
      rating: attributes.rating,
      selected_club: attributes.selectedClub,
    };
  },
});

export const validateRequest = async (
  sessionId: string,
): Promise<
  { user: User; session: Session } | { user: null; session: null }
> => {
  let result: { user: User; session: Session } | { user: null; session: null } =
    {
      user: null,
      session: null,
    };

  if (!sessionId) {
    return result;
  }

  try {
    result = await lucia.validateSession(sessionId);
  } catch (e) {
    console.log(e);
  }
  return result;
};

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: Omit<DatabaseUser, 'id'>;
  }
}
