#!/usr/bin/env bash
set -euo pipefail
out="$(cd "$(dirname "$0")/.." && pwd)/artifacts/api-server/src/kinfolk/__tests__/fixtures"
mkdir -p "$out"
ffmpeg -hide_banner -loglevel error -y -f lavfi \
  -i "flite=text='Kinfolk provider readiness confirms real voice transcription.'" \
  -ar 16000 -ac 1 "$out/voice.wav"
ffmpeg -hide_banner -loglevel error -y -i "$out/voice.wav" -codec:a libmp3lame -b:a 48k "$out/voice.mp3"
ffmpeg -hide_banner -loglevel error -y -i "$out/voice.wav" -codec:a aac -b:a 48k "$out/voice.m4a"
ffmpeg -hide_banner -loglevel error -y -i "$out/voice.wav" -codec:a libopus -b:a 32k "$out/voice.webm"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'color=c=black:s=16x16:d=0.4' -f lavfi -i 'sine=frequency=440:duration=0.4' -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac "$out/video-with-audio.mp4"
printf 'created=%s\n' "$out"
