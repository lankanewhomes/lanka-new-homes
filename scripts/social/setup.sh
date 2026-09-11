#!/usr/bin/env bash
# One-time setup for the social renderer. Run from the repo root:
#   bash scripts/social/setup.sh            # full (with depth/parallax, ~2 GB)
#   bash scripts/social/setup.sh --light    # renderer only, no parallax
set -euo pipefail
VENV="${SOCIAL_VENV:-.venv-social}"
python3 -m venv "$VENV"
"$VENV/bin/pip" install -q --upgrade pip
if [[ "${1:-}" == "--light" ]]; then
  "$VENV/bin/pip" install -q pillow numpy scipy
else
  "$VENV/bin/pip" install -q -r scripts/social/requirements.txt
fi
# ffmpeg: system install wins; otherwise a local ffmpeg-static (not saved to package.json)
if ! command -v ffmpeg >/dev/null 2>&1 && ! node -e "require('ffmpeg-static')" >/dev/null 2>&1; then
  npm install --no-save ffmpeg-static
fi
echo "ok — venv at $VENV. Generate with: npm run social:generate -- <project-slug>"
