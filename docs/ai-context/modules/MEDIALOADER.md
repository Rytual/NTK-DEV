# MediaLoader Module - AI Context Documentation

## Module Overview

**MediaLoader** is a global media management system that provides video and image backgrounds for the UI. It monitors external directories, uses Fisher-Yates shuffle for random selection, and gracefully falls back to procedural CSS gradients.

### Core Purpose
- External media file management
- Random background selection
- CSS gradient fallbacks
- File system watching

---

## File Structure

```
src/modules/academy/backend/engines/MediaLoader.cjs   # Main engine (577 lines)

External directories:
/art/
├── videos/    # Video backgrounds
└── images/    # Image backgrounds
```

*Note: MediaLoader is part of Academy module but exposed globally via IPC.*

---

## Configuration

**Supported Formats**:
```javascript
videoFormats = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
```

**Default Paths**:
```javascript
videosPath = '/art/videos';
imagesPath = '/art/images';
```

---

## Core Class: MediaLoader

**Key Class**: `MediaLoader extends EventEmitter`

**Constructor Options**:
```javascript
const loader = new MediaLoader({
  videosPath: '/custom/videos',
  imagesPath: '/custom/images'
});
```

**Core Methods**:

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getRandomImage()` | none | `Media \| Gradient` | Random image or gradient fallback |
| `getRandomVideo()` | none | `Media \| null` | Random video or null |
| `getRandomImages(count)` | count | `(Media \| Gradient)[]` | Multiple random selections |
| `generateProceduralGradient()` | none | `Gradient` | CSS gradient fallback |
| `generateRadialGradient()` | none | `Gradient` | Radial gradient variant |
| `reload()` | none | void | Reload all media |
| `getStats()` | none | `Stats` | Media statistics |
| `getAllMedia()` | none | `{videos, images, stats}` | All loaded media |
| `hasFile(filename)` | filename | `boolean` | Check if file exists |
| `getFile(filename)` | filename | `Media \| null` | Get specific file |

---

## Media Object Structures

**Image/Video Object**:
```javascript
{
  type: 'image' | 'video',
  path: '/art/images/background.jpg',
  filename: 'background.jpg',
  ext: '.jpg',
  size: 1234567  // bytes
}
```

**Gradient Object**:
```javascript
{
  type: 'gradient',
  name: 'Purple Dream',
  value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  colors: ['#667eea', '#764ba2']
}
```

---

## Fisher-Yates Shuffle

The module uses the Fisher-Yates shuffle algorithm for unbiased random selection:

```javascript
fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

---

## Gradient Fallbacks

When no images are available, the module provides 20 hand-crafted CSS gradients:

| Name | Gradient |
|------|----------|
| Purple Dream | `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` |
| Sunset | `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)` |
| Ocean Blue | `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)` |
| Mint Fresh | `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)` |
| Sunrise | `linear-gradient(135deg, #fa709a 0%, #fee140 100%)` |
| Northern Lights | `linear-gradient(135deg, #30cfd0 0%, #330867 100%)` |
| Peachy | `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)` |
| Cool Sky | `linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)` |
| Purple Bliss | `linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)` |
| Twilight | `linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)` |
| Fire | `linear-gradient(135deg, #ff0844 0%, #ffb199 100%)` |
| Forest | `linear-gradient(135deg, #134e5e 0%, #71b280 100%)` |
| Royal | `linear-gradient(135deg, #141e30 0%, #243b55 100%)` |
| Lemon | `linear-gradient(135deg, #f6d365 0%, #fda085 100%)` |
| Paradise | `linear-gradient(135deg, #1cd8d2 0%, #93edc7 100%)` |
| Rose | `linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)` |
| Cosmic | `linear-gradient(135deg, #2e1753 0%, #1f1746 100%)` |
| Aqua | `linear-gradient(135deg, #13547a 0%, #80d0c7 100%)` |
| Cherry | `linear-gradient(135deg, #eb3349 0%, #f45c43 100%)` |
| Lavender | `linear-gradient(135deg, #ada996 0%, #f2f2f2 100%)` |

---

## File System Watching

The module uses `fs.watch()` to monitor directories for changes:

```javascript
setupWatchers() {
  const watcher = fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
    if (filename) {
      this._scheduleReload();  // Debounced reload
    }
  });
}

_scheduleReload() {
  clearTimeout(this._reloadTimer);
  this._reloadTimer = setTimeout(() => {
    this.reload();
  }, 1000);  // 1 second debounce
}
```

---

## Events

| Event | Data | Description |
|-------|------|-------------|
| `initialized` | `Stats` | Module initialized |
| `reload` | `{videos: {old, new}, images: {old, new}}` | Media reloaded |
| `cleanup` | none | Module cleanup |

---

## Statistics

```javascript
getStats() {
  return {
    videosLoaded: this.videos.length,
    imagesLoaded: this.images.length,
    reloadCount: this.stats.reloadCount,
    lastReload: this.stats.lastReload,
    watchersActive: this.stats.watchersActive,
    directories: {
      videos: this.videosPath,
      images: this.imagesPath
    },
    available: {
      videos: this.videos.length,
      images: this.images.length
    },
    usingFallbacks: {
      videos: this.videos.length === 0,
      images: this.images.length === 0
    }
  };
}
```

---

## IPC Channels

| Channel | Direction | Parameters | Returns |
|---------|-----------|------------|---------|
| `media:getRandomImage` | Renderer → Main | none | `Media \| Gradient` |
| `media:getRandomVideo` | Renderer → Main | none | `Media \| null` |
| `media:getStats` | Renderer → Main | none | `Stats` |
| `media:reload` | Renderer → Main | none | void |

---

## Usage Examples

### Get Random Background
```javascript
// In renderer
const background = await window.electronAPI.invoke('media:getRandomImage');

if (background.type === 'image') {
  element.style.backgroundImage = `url(${background.path})`;
} else {
  element.style.background = background.value;
}
```

### Check Availability
```javascript
const stats = await window.electronAPI.invoke('media:getStats');

if (stats.usingFallbacks.images) {
  console.log('Using gradient fallbacks - add images to /art/images/');
}
```

---

## Integration Points

### With Academy
- Module background images
- Study session visuals

### With Dashboard
- Hero background
- Card backgrounds

### With All Modules
- Consistent visual theming
- Graceful degradation

---

## Improvement Opportunities

1. **Image Optimization**: Auto-resize for different viewport sizes
2. **Video Streaming**: HLS/DASH for large videos
3. **Thumbnail Generation**: Preview thumbnails
4. **Category Tags**: Organize media by category
5. **Favorites**: Mark favorite backgrounds
6. **Scheduled Rotation**: Auto-rotate backgrounds
7. **Remote Sources**: CDN/cloud media support
8. **Format Conversion**: Auto-convert unsupported formats
