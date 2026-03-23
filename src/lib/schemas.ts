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

export const joinRoomSchema = v.object({
  displayName: displayNameSchema,
  roomId: v.pipe(v.string(), v.minLength(1)),
});
