# Interactive reels (game formats)

Small Pillow + ffmpeg engine built 2026-11-14. No Remotion needed.

| File | What it is |
|---|---|
| `reelkit.py` | The engine: text animation, photo window with blurred bands, grid lines top and bottom, logo, end card, transitions |
| `reels.py` | Five formats: 1 Higher or Lower, 2 Guess the City, 3 This or That, 4 Countdown, 5 Quick Quiz (land, green) |

Run from this folder (photo paths are relative, and do not use `-I`):

    ../../../.venv-social/bin/python reels.py <1-5> OUT.mp4            # full video
    ../../../.venv-social/bin/python reels.py <1-5> OUT.png --still 1.4   # one frame

Photos are not in the repo. Put each listing's gallery photos in `photos/<slug>/` (a copy is kept on the owner's
Desktop in `5 New Reels - 2026-11-14/scripts/photos/`). `reelkit.py` reads the font, logo and ffmpeg from the repo
through the `REPO` path at the top of the file.

Rules built in: logo top-left, grid lines top and bottom, orange for projects and green for land, small LINK IN BIO,
link only on the end card, no developer names, nothing about units sold or left. Leave out any photo where a
developer's name is readable.

Status: Guess the City (Yarl Royal Palace, Jaffna) was posted on 2026-11-14 with 11 photos. Quick Quiz (The Highway,
Kottawa) is approved in principle and still needs more photos.
