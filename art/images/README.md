# Ninja Toolkit - Image Assets

Drop your feudal ninja-themed images here!

## Supported Formats:
- PNG (.png)
- JPG/JPEG (.jpg, .jpeg)
- WebP (.webp)
- SVG (.svg)
- GIF (.gif)
- BMP (.bmp)

## Usage:
The global MediaLoader (`src/core/media`) automatically detects images in this directory using `fs.watch()` and makes them available to all modules:
- **Prompt 1**: Splash screen backgrounds
- **Prompt 6**: Security backgrounds & achievement badges
- **Prompt 10**: Achievement badges, rank icons, & rewards

## How It Works:
1. **Drop files**: Simply place your image files in this directory
2. **Auto-detection**: The MediaLoader watches for changes and automatically loads new files
3. **Random selection**: Files are selected using Fisher-Yates shuffle for unbiased randomization
4. **Hot reload**: Adding or removing files triggers automatic reload (1 second debounce)

## Suggested Categories:
Organize your files with clear naming conventions:

### Ranks:
- `rank-genin.png` - Genin rank badge
- `rank-chunin.png` - Chunin rank badge
- `rank-jonin.png` - Jonin rank badge
- `rank-hokage.png` - Hokage rank badge

### Achievement Badges:
- `badge-first-steps.png` - First module completed
- `badge-perfect-score.png` - 100% exam score
- `badge-speed-demon.png` - Completed in record time
- `badge-master-ninja.png` - All modules mastered

### Backgrounds:
- `bg-village-gate.jpg` - Village entrance
- `bg-training-grounds.jpg` - Training area
- `bg-dojo-interior.jpg` - Inside the dojo
- `bg-mountain-path.jpg` - Mountain training location

### Characters:
- `character-student-01.png` - Ninja student avatar
- `character-master-01.png` - Ninja master avatar
- `character-sensei-01.png` - Sensei character

## Notes:
- No minimum or maximum file size
- Subdirectories are NOT monitored (flat structure only)
- Hidden files (starting with `.`) are ignored
- Files are served from disk, not embedded in the app
- SVG files work great for badges and icons
- High-resolution images are recommended for backgrounds

## Automatic Fallback:
If this directory is empty, the MediaLoader automatically generates **20 procedural CSS gradients** with names like:
- Purple Dream
- Ocean Blue
- Sunset
- Northern Lights
- Fire
- ...and more

These gradients provide a beautiful fallback that requires no external files. However, custom images are always preferred and will be used when available.

## Randomization Details:
The Fisher-Yates shuffle algorithm ensures:
- **Unbiased selection**: Every image has equal probability
- **No patterns**: True randomness, not pseudo-random
- **Efficient**: O(n) time complexity
- **Fair**: No preference to file order or naming

This is the industry-standard shuffle algorithm used in casino software and scientific applications.
