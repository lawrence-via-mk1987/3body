#!/usr/bin/env bash
# Kairos Redeemer update helper.
#
# Pulls the latest changes for the current branch, then runs the QA harness
# so you know the build is healthy before opening Godot.
#
# Usage:
#   ./update.sh [path-to-godot-binary]
#
# On macOS, if Godot is not on your PATH:
#   ./update.sh /Applications/Godot.app/Contents/MacOS/Godot

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null)"

if [[ -z "$REPO_ROOT" ]]; then
	echo "This folder is not a git clone, so it cannot pull updates."
	echo
	echo "You likely downloaded a ZIP. To switch to a git clone once:"
	echo "  git clone https://github.com/lawrence-via-mk1987/3body.git"
	echo "  cd 3body"
	echo "  git checkout cursor/kairos-redeemer-transfer-ec01"
	echo
	echo "After that, ./update.sh will work every time."
	exit 1
fi

BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"

echo "== Repo:   $REPO_ROOT"
echo "== Branch: $BRANCH"
echo

if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
	echo "You have local changes:"
	git -C "$REPO_ROOT" status --short
	echo
	echo "Commit or stash them first, for example:"
	echo "  git stash"
	exit 1
fi

echo "--- Pulling latest ---"
if ! git -C "$REPO_ROOT" pull origin "$BRANCH"; then
	echo "Pull failed. Check your network or credentials."
	exit 1
fi
echo

echo "--- Running QA ---"
"$SCRIPT_DIR/qa.sh" "$@"
QA_STATUS=$?
echo

if [[ $QA_STATUS -eq 0 ]]; then
	echo "== Up to date and healthy. Open Godot and press Play. =="
else
	echo "== Updated, but QA failed. Send the failure text to the agent. =="
fi

exit $QA_STATUS
