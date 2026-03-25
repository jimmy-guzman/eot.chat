const SESSION_TTL_SEC = 86_400;

// eslint-disable-next-line n/prefer-global/text-encoder -- PartyKit worker global
const enc = new TextEncoder();

const importKey = (secret: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );
};

const toBase64Url = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);

  let binary = "";

  for (const b of bytes) {
    binary += String.fromCodePoint(b);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

const fromBase64Url = (str: string): ArrayBuffer => {
  const padLength = (4 - (str.length % 4)) % 4;
  const padded =
    str.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    // eslint-disable-next-line unicorn/prefer-code-point -- byte lane from atob()
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }

  return bytes.buffer;
};

const tryFromBase64Url = (str: string) => {
  try {
    return fromBase64Url(str);
  } catch {
    return null;
  }
};

export const mintRoomSessionToken = async (
  roomId: string,
  secret: string,
): Promise<string> => {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const encoded = toBase64Url(
    enc.encode(JSON.stringify({ exp, roomId, typ: "session" })),
  );
  const key = await importKey(secret);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(encoded));

  return `${encoded}.${toBase64Url(sigBuf)}`;
};

export const verifyRoomSessionToken = async (
  token: string,
  secret: string,
): Promise<null | { roomId: string }> => {
  const dot = token.lastIndexOf(".");

  if (dot === -1) return null;

  const encoded = token.slice(0, dot);
  const sig = tryFromBase64Url(token.slice(dot + 1));

  if (!sig) return null;

  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    enc.encode(encoded),
  );

  if (!valid) return null;

  try {
    // eslint-disable-next-line n/prefer-global/text-decoder -- Web Crypto compatible
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const v = JSON.parse(json) as { exp: number; roomId: string; typ: string };

    if (
      v.typ !== "session" ||
      typeof v.roomId !== "string" ||
      typeof v.exp !== "number" ||
      v.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { roomId: v.roomId };
  } catch {
    return null;
  }
};
