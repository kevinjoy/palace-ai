/**
 * Palace URI — addressable state references.
 * Format: palace://{scope}/{path}
 *
 * Security: paths are validated against traversal attacks.
 * No ".." segments allowed. Paths are normalized.
 */

import type { PalaceUri } from "../types.ts";
import { PathTraversalError } from "../errors/palace-errors.ts";

const PALACE_URI_REGEX = /^palace:\/\/([^/]+)\/(.+)$/;
const TRAVERSAL_PATTERN = /(?:^|\/)\.\./;

/** Parse a palace:// URI string into components */
export function parsePalaceUri(uri: string): PalaceUri {
  const match = PALACE_URI_REGEX.exec(uri);
  if (!match) {
    throw new Error(`Invalid Palace URI: ${uri}. Expected format: palace://{scope}/{path}`);
  }

  const scope = match[1]!;
  const path = match[2]!;

  // Security: block path traversal attempts
  if (TRAVERSAL_PATTERN.test(path)) {
    throw new PathTraversalError(uri, path);
  }

  // Normalize: remove trailing slashes, collapse double slashes
  const normalizedPath = path.replace(/\/+/g, "/").replace(/\/$/, "");

  return {
    scheme: "palace",
    scope,
    path: normalizedPath,
  };
}

/** Build a palace:// URI from components */
export function buildPalaceUri(scope: string, path: string): string {
  return `palace://${scope}/${path}`;
}

/** Validate that a resolved filesystem path stays within the allowed base directory */
export function validateContainment(resolvedPath: string, baseDir: string): void {
  const normalizedResolved = resolvedPath.replace(/\/+/g, "/");
  const normalizedBase = baseDir.replace(/\/+/g, "/");

  if (!normalizedResolved.startsWith(normalizedBase)) {
    throw new PathTraversalError(resolvedPath, `escapes base directory: ${baseDir}`);
  }
}
