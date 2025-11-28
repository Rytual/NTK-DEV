# Global Media System

This directory contains the **global media management system** for Ninja Toolkit.

## Overview

The MediaLoader provides centralized, honest media management for all Ninja Toolkit modules. It monitors external `/art` directories and makes videos and images available throughout the application via a singleton pattern.

## Architecture

```
src/core/media/
├── MediaLoader.js    # Core media loading and watching engine
├── index.js          # Singleton wrapper for global access
└── README.md         # This file

art/
├── videos/           # Drop MP4, WebM, MOV files here
│   └── README.md
└── images/           # Drop PNG, JPG, SVG files here
    └── README.md
```

## Key Features

### 1. File System Watching
- Uses Node.js `fs.watch()` to monitor `/art/videos` and `/art/images`
- Automatically detects when files are added, removed, or modified
- Debounced reload (1 second delay) to avoid rapid successive reloads
- Event-driven notifications when media changes

### 2. Fisher-Yates Shuffle
- Industry-standard unbiased shuffle algorithm
- O(n) time complexity
- Equal probability for all items
- No patterns or predictability

### 3. Graceful Degradation
- **No videos?** Application continues without video backgrounds
- **No images?** Automatically generates 20 procedural CSS gradients
- Never crashes or breaks due to missing media

### 4. Singleton Pattern
- One instance shared across all modules
- Prevents duplicate file watchers
- Centralized media cache
- Unified event system

## Usage

### Basic Usage

```javascript
const { getMediaLoader } = require('./core/media');

const mediaLoader = getMediaLoader();

// Get a random image (or gradient fallback)
const background = mediaLoader.getRandomImage();

if (background.type === 'image') {
  console.log('Using image:', background.filename);
  // Use background.path to load the file
} else if (background.type === 'gradient') {
  console.log('Using gradient:', background.name);
  // Apply CSS: background.value
}

// Get a random video
const video = mediaLoader.getRandomVideo();
if (video) {
  console.log('Using video:', video.filename);
  // Use video.path to load the file
}

// Get multiple images
const images = mediaLoader.getRandomImages(5);
```

### Event Listening

```javascript
const mediaLoader = getMediaLoader();

// Listen for initialization
mediaLoader.on('initialized', (stats) => {
  console.log('MediaLoader ready:', stats);
});

// Listen for media reloads
mediaLoader.on('reload', (changes) => {
  console.log('Media reloaded:', changes);
  // Update UI with new media
});

// Listen for cleanup
mediaLoader.on('cleanup', () => {
  console.log('MediaLoader shutting down');
});
```

### Get Statistics

```javascript
const stats = mediaLoader.getStats();

console.log('Videos loaded:', stats.available.videos);
console.log('Images loaded:', stats.available.images);
console.log('Using fallbacks:', stats.usingFallbacks);
console.log('Reload count:', stats.reloadCount);
console.log('Watchers active:', stats.watchersActive);
```

## API Reference

### `getMediaLoader()`
Returns the global singleton instance of MediaLoader.

### `MediaLoader` Class

#### Methods

- **`getRandomImage()`** - Returns a random image or gradient fallback
- **`getRandomVideo()`** - Returns a random video or null
- **`getRandomImages(count)`** - Returns array of random images/gradients
- **`generateProceduralGradient()`** - Returns a procedural CSS gradient
- **`getAllMedia()`** - Returns all available media
- **`getStats()`** - Returns statistics about loaded media
- **`reload()`** - Manually trigger media reload
- **`cleanup()`** - Stop watchers and clear memory

#### Events

- **`initialized`** - Emitted when MediaLoader starts
- **`reload`** - Emitted when media is reloaded
- **`cleanup`** - Emitted when MediaLoader shuts down

## Integration with Modules

### Prompt 1 (Splash Screen)
Uses MediaLoader for random background images/gradients on the splash screen.

### Prompt 6 (Security Suite)
Uses MediaLoader for:
- Background images in security dashboards
- Achievement badge images
- Video backgrounds for security training

### Prompt 10 (Gamification Engine)
Uses MediaLoader for:
- Achievement badge images
- Rank badge images
- Reward celebration videos
- Progress backgrounds

## Design Principles

### Honesty
- NO fake files
- NO generated content pretending to be user content
- NO padding with dummy data
- Honest fallbacks when directories are empty

### Graceful Degradation
- Application never breaks due to missing media
- Elegant CSS gradient fallbacks
- Clear console logging
- Proper error handling

### Performance
- Fisher-Yates O(n) shuffle
- Debounced file watching
- Single instance via singleton
- Minimal memory footprint

### Transparency
- Clear console logging
- Detailed statistics
- Event notifications
- Diagnostic methods

## Testing

```javascript
const { getMediaLoader } = require('./core/media');

const mediaLoader = getMediaLoader();

// Run diagnostics
await mediaLoader.test();

// Check stats
console.log(mediaLoader.getStats());

// Test shuffle algorithm
const items = [1, 2, 3, 4, 5];
const shuffled = mediaLoader.fisherYatesShuffle(items);
console.log('Shuffled:', shuffled);
```

## Future Modules

This global media system can be used by any future Ninja Toolkit modules:
- Prompt 2: PowerShell Terminal
- Prompt 3: Module Architecture
- Prompt 4: Data Flow
- Prompt 5: Error Handling
- Prompt 7: API Integration
- Prompt 8: Data Providers
- Prompt 9: Offline Mode

Simply import and use:
```javascript
const { getMediaLoader } = require('../core/media');
const mediaLoader = getMediaLoader();
```

## File Format Support

### Videos
- MP4 (.mp4)
- WebM (.webm)
- MOV (.mov)
- AVI (.avi)
- MKV (.mkv)
- M4V (.m4v)

### Images
- PNG (.png)
- JPG/JPEG (.jpg, .jpeg)
- WebP (.webp)
- SVG (.svg)
- GIF (.gif)
- BMP (.bmp)

## License

This media system is part of the Ninja Toolkit and follows the same license as the main project.
