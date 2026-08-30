#!/usr/bin/env bash
# Kairos Redeemer QA runner.
#
# Usage:
#   ./qa.sh [path-to-godot-binary]
#
# On macOS the editor binary usually lives at:
#   /Applications/Godot.app/Contents/MacOS/Godot

set -uo pipefail

GODOT="${1:-}"

if [[ -z "$GODOT" ]]; then
	for candidate in \
		"godot" \
		"/Applications/Godot.app/Contents/MacOS/Godot" \
		"/workspace/tools/godot/Godot_v4.4.1-stable_linux.x86_64"
	do
		if command -v "$candidate" >/dev/null 2>&1 || [[ -x "$candidate" ]]; then
			GODOT="$candidate"
			break
		fi
	done
fi

if [[ -z "$GODOT" ]]; then
	echo "Could not find a Godot binary. Pass one explicitly:"
	echo "  ./qa.sh /Applications/Godot.app/Contents/MacOS/Godot"
	exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/game" && pwd)"
STATUS=0

echo "== Godot: $GODOT"
echo "== Project: $PROJECT_DIR"
echo

echo "--- 1/2 Script + scene load check ---"
RUN_OUTPUT="$("$GODOT" --headless --path "$PROJECT_DIR" --quit 2>&1)"
if echo "$RUN_OUTPUT" | grep -qE "SCRIPT ERROR|Parse Error|Compile Error|Failed to load script"; then
	echo "FAIL: script errors detected"
	echo "$RUN_OUTPUT" | grep -E "SCRIPT ERROR|Parse Error|Compile Error|Failed to load script|  *at: " | head -40
	STATUS=1
else
	echo "PASS: project loads with no script errors"
fi
echo

echo "--- 2/2 Script compile + content validation ---"
QA_OUTPUT="$("$GODOT" --headless --path "$PROJECT_DIR" res://scenes/qa/qa_runner.tscn 2>&1)"
if echo "$QA_OUTPUT" | grep -q "^QA: ALL CHECKS PASSED"; then
	echo "$QA_OUTPUT" | grep "^QA:"
else
	echo "FAIL: content validation"
	echo "$QA_OUTPUT" | grep -E "^QA:|^  - " | head -40
	STATUS=1
fi
echo

if [[ $STATUS -eq 0 ]]; then
	echo "== QA PASSED =="
else
	echo "== QA FAILED =="
fi

exit $STATUS
