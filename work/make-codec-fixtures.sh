#!/bin/sh
# Optional codec checks: uses an existing FFmpeg; installs nothing.
set -eu
ffmpeg -v error -y -i tmp/fixtures/reference.png -frames:v 1 tmp/fixtures/reference.jpg
python3 -c 'from PIL import Image; Image.open("tmp/fixtures/reference.png").save("tmp/fixtures/reference.webp")'
ffmpeg -v error -y -i tmp/fixtures/tone.wav -codec:a libmp3lame tmp/fixtures/tone.mp3
