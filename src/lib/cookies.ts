import type { cookies } from "next/headers";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const COOKIE_MAX_AGE = 86_400;
const COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: COOKIE_MAX_AGE,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
} as const;

interface RoomSessionCookieOptions {
  displayName: string;
  hostSecret?: string;
  roomId: string;
  sessionId: string;
  sessionToken: string;
}

export const setRoomSessionCookies = (
  cookieStore: CookieStore,
  {
    displayName,
    hostSecret,
    roomId,
    sessionId,
    sessionToken,
  }: RoomSessionCookieOptions,
): void => {
  cookieStore.set(`display-name-${roomId}`, displayName, {
    ...COOKIE_OPTIONS,
    path: `/r/${roomId}`,
  });

  if (hostSecret) {
    cookieStore.set(`room-host-${roomId}`, hostSecret, {
      ...COOKIE_OPTIONS,
      path: `/r/${roomId}`,
    });
  }

  cookieStore.set(`room-session-${roomId}`, sessionToken, {
    ...COOKIE_OPTIONS,
    path: `/r/${roomId}`,
  });

  cookieStore.set(`room-session-id-${roomId}`, sessionId, {
    ...COOKIE_OPTIONS,
    path: `/r/${roomId}`,
  });
};
