# Audio Assets

## Current Audio File

The current `zuizui_song.mp3` file contains the **actual music** - "Zuizui Song Japanese-style Rock (Female Vocal)". The file has been converted from WAV to MP3 format (192kbps) to reduce file size from 35MB to approximately 4.8MB.

## Required Audio File

To play the actual game with music, you need the original audio file:

- **File name**: `zuizui_song.mp3` (or `zuizui_song.wav`)
- **Format**: MP3 (recommended) or WAV
- **Duration**: 3:26 (206 seconds)
- **Size**: ~3MB (MP3) or ~35MB (WAV)

## How to Replace with Real Audio File

Due to file size limitations in Git, the original audio file cannot be included in the repository. To add the real music:

1. Place your audio file in this directory (`assets/audio/`)
2. Name it `zuizui_song.mp3` (or convert to MP3 format)
3. Restart the development server

## Alternative: Use MP3 Format

To reduce file size, you can convert the WAV file to MP3:

```bash
# Install ffmpeg if not already installed
sudo apt-get install ffmpeg

# Convert WAV to MP3
ffmpeg -i zuizui_song.wav -b:a 192k zuizui_song.mp3
```

Then update the audio import in `app/game.tsx`:

```typescript
// Change from:
const player = useAudioPlayer(require("@/assets/audio/zuizui_song.wav"));

// To:
const player = useAudioPlayer(require("@/assets/audio/zuizui_song.mp3"));
```

## Cloud Storage Option

For production deployment, consider hosting the audio file on a CDN or cloud storage service (e.g., AWS S3, Google Cloud Storage) and load it dynamically in the app.
