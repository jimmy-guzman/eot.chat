import * as v from "valibot";

export const displayNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Name is required"),
  v.maxLength(50, "Name must be 50 characters or fewer"),
);

export const roomNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Room name is required"),
  v.maxLength(80, "Room name must be 80 characters or fewer"),
);

export const createRoomSchema = v.object({
  displayName: displayNameSchema,
  roomName: roomNameSchema,
});

export const joinCodeSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(6, "Room code is required"),
  v.maxLength(6, "Room code is too long"),
  v.regex(/^[2-9a-hjkmnp-z]+$/, "Invalid room code"),
);

export const joinRoomSchema = v.object({
  displayName: displayNameSchema,
  joinCode: joinCodeSchema,
});

export const leaveRoomSchema = v.object({
  roomId: v.pipe(v.string(), v.minLength(1)),
});

export const rotateJoinCodeSchema = v.object({
  roomId: v.pipe(v.string(), v.minLength(1)),
});
