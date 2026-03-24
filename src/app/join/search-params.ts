import { createLoader, parseAsString } from "nuqs/server";

export const joinPageSearchParams = {
  code: parseAsString.withDefault(""),
};

export const loadJoinPageSearchParams = createLoader(joinPageSearchParams);
