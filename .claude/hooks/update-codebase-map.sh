#!/usr/bin/env bash
# PostToolUse hook: Detect structural changes in src/ and signal codebase map update
# Fires after Write|Edit on src/ files, or after git pull/merge
# Only triggers when file STRUCTURE changes (new/renamed/deleted files), not content edits

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC_DIR="$PROJECT_ROOT/src"
HASH_FILE="$PROJECT_ROOT/.claude/.structure-hash"

# Exit silently if src/ doesn't exist yet (pre-implementation phase)
if [ ! -d "$SRC_DIR" ]; then
  exit 0
fi

# Read stdin to get tool info
INPUT=$(cat)

# For Write/Edit: check if the file is in src/
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)

if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  # Only care about src/ files
  case "$FILE_PATH" in
    */src/*) ;;
    *) exit 0 ;;
  esac
fi

if [ "$TOOL_NAME" = "Bash" ]; then
  # Only care about git pull/merge/checkout commands
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
  case "$COMMAND" in
    *git\ pull*|*git\ merge*|*git\ checkout*|*git\ rebase*) ;;
    *) exit 0 ;;
  esac
fi

# Compute structural hash: sorted list of all file paths in src/
CURRENT_HASH=$(find "$SRC_DIR" -type f | sort | md5 2>/dev/null || find "$SRC_DIR" -type f | sort | md5sum 2>/dev/null | cut -d' ' -f1)

# Compare to cached hash
PREV_HASH=""
if [ -f "$HASH_FILE" ]; then
  PREV_HASH=$(cat "$HASH_FILE")
fi

if [ "$CURRENT_HASH" = "$PREV_HASH" ]; then
  # No structural change — content-only edit
  exit 0
fi

# Structural change detected — update hash cache
echo "$CURRENT_HASH" > "$HASH_FILE"

# Signal to Claude that codebase map needs updating
cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "STRUCTURAL CHANGE DETECTED in src/. New files, renamed files, or new modules were added or removed. Please update docs/codebase-map.md to reflect the current codebase structure. Only update the diagrams that are affected by the structural change."
  }
}
EOF
