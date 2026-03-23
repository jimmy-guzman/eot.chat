import { createEnv } from "@t3-oss/env-nextjs";
import * as v from "valibot";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_PARTYKIT_HOST: v.pipe(v.string(), v.minLength(1)),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_PARTYKIT_HOST: process.env.NEXT_PUBLIC_PARTYKIT_HOST,
  },
  server: {
    PARTYKIT_URL: v.pipe(v.string(), v.url()),
  },
});
