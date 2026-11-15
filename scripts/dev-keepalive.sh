#!/bin/zsh
# Keeps the local site (npm run dev, port 3000) running (owner, 2026-11-15: "make sure the npm run dev always running").
# Every 30 seconds: if nothing is listening on port 3000, start `npm run dev` again. It never kills a server that is up, even a slow one:
# after a start the site can take 2 to 4 minutes to answer while it compiles, and killing it then would loop forever.
#   start:  nohup zsh scripts/dev-keepalive.sh >/dev/null 2>&1 &
#   stop:   pkill -f dev-keepalive.sh
#   log:    ~/Library/Logs/lnh-dev-keepalive.log   (the site's own output: ~/Library/Logs/lnh-dev-server.log)
cd "$(dirname "$0")/.." || exit 1
LOG=~/Library/Logs/lnh-dev-keepalive.log
while true; do
  if ! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
    # A start already under way (npm or next is alive but the port is not open yet) is left alone.
    if ! pgrep -f "next dev" >/dev/null 2>&1; then
      echo "$(date '+%Y-%m-%d %H:%M:%S') port 3000 is closed, starting npm run dev" >> "$LOG"
      nohup npm run dev >> ~/Library/Logs/lnh-dev-server.log 2>&1 &
      sleep 90
    fi
  fi
  sleep 30
done
