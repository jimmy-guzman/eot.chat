import { customAlphabet } from "nanoid";

export const generateJoinCode = customAlphabet(
  "23456789abcdefghjkmnpqrstuvwxyz",
  6,
);
