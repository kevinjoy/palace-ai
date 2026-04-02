/**
 * Palace URI — addressable state references.
 * Format: palace://{scope}/{path}
 * Full implementation in Step 4 (INTERN-56).
 */

import type { PalaceUri } from "../types.ts";

const PALACE_URI_REGEX = /^palace:\/\/([^/]+)\/(.+)$/;

/** Parse a palace:// URI string into components */
export function parsePalaceUri(uri: string): PalaceUri {
  const match = PALACE_URI_REGEX.exec(uri);
  if (!match) {
    throw new Error(`Invalid Palace URI: ${uri}. Expected format: palace://{scope}/{path}`);
  }
  return {
    scheme: "palace",
    scope: match[1]!,
    path: match[2]!,
  };
}

/** Build a palace:// URI from components */
export function buildPalaceUri(scope: string, path: string): string {
  return `palace://${scope}/${path}`;
}
