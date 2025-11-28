# Ninja Toolkit - Video Assets

Drop your feudal ninja-themed videos here!

## Supported Formats:
- MP4 (.mp4)
- WebM (.webm)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- M4V (.m4v)

## Usage:
The global MediaLoader (`src/core/media`) automatically detects videos in this directory using `fs.watch()` and makes them available to all modules:
- **Prompt 1**: Splash screen backgrounds
- **Prompt 6**: Security suite backgrounds
- **Prompt 10**: Reward animations

## How It Works:
1. **Drop files**: Simply place your video files in this directory
2. **Auto-detection**: The MediaLoader watches for changes and automatically loads new files
3. **Random selection**: Files are selected using Fisher-Yates shuffle for unbiased randomization
4. **Hot reload**: Adding or removing files triggers automatic reload (1 second debounce)

## Example Files:
- `ninja-scroll-reveal.mp4` - Opening animation with scrolls
- `training-montage.webm` - Epic training sequences
- `rank-up-ceremony.mov` - Promotion celebration videos
- `dojo-entrance.mp4` - Entrance to the dojo background

## Notes:
- No minimum or maximum file size
- Subdirectories are NOT monitored (flat structure only)
- Hidden files (starting with `.`) are ignored
- Files are served from disk, not embedded in the app

## Graceful Degradation:
If this directory is empty, the application continues to work normally without video backgrounds. Videos are an enhancement, not a requirement.
