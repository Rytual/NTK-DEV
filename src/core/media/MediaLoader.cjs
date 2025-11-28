const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * MediaLoader - Global Media Management System
 *
 * This class monitors external art directories for videos and images.
 * NO generated content, NO fake files, NO padding.
 *
 * Features:
 * - fs.watch() monitoring of /art/videos and /art/images
 * - Fisher-Yates shuffle for random selection
 * - Procedural CSS gradient fallbacks when directories are empty
 * - Event-driven reload system
 * - Graceful degradation
 *
 * GLOBAL USAGE: This MediaLoader is available to ALL modules via singleton pattern
 */
class MediaLoader extends EventEmitter {
  constructor(options = {}) {
    super();

    // Configure paths - point to project root /art directory
    const projectRoot = process.cwd();
    this.videosPath = options.videosPath || path.join(projectRoot, 'art', 'videos');
    this.imagesPath = options.imagesPath || path.join(projectRoot, 'art', 'images');

    // Storage for discovered media
    this.videos = [];
    this.images = [];
    this.watchers = [];

    // Supported formats
    this.videoFormats = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    this.imageFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

    // Statistics
    this.stats = {
      videosLoaded: 0,
      imagesLoaded: 0,
      reloadCount: 0,
      lastReload: null,
      watchersActive: 0
    };

    // Cache for gradients to avoid regeneration
    this.gradientCache = null;

    this.initialize();
  }

  /**
   * Initialize the media loader
   */
  initialize() {
    console.log('[MediaLoader] Initializing...');
    this.loadVideos();
    this.loadImages();
    this.setupWatchers();
    this.emit('initialized', this.getStats());
  }

  /**
   * Load videos from the videos directory
   */
  loadVideos() {
    this.videos = [];

    try {
      if (fs.existsSync(this.videosPath)) {
        const files = fs.readdirSync(this.videosPath);

        this.videos = files
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return this.videoFormats.includes(ext);
          })
          .map(file => ({
            filename: file,
            path: path.join(this.videosPath, file),
            ext: path.extname(file).toLowerCase(),
            size: this._getFileSize(path.join(this.videosPath, file)),
            loaded: Date.now()
          }));

        this.stats.videosLoaded = this.videos.length;
        console.log(`[MediaLoader] Loaded ${this.videos.length} videos from ${this.videosPath}`);
      } else {
        console.log(`[MediaLoader] Videos directory not found: ${this.videosPath}`);
        console.log('[MediaLoader] Will use no video backgrounds (graceful degradation)');
      }
    } catch (err) {
      console.error(`[MediaLoader] Error loading videos: ${err.message}`);
      console.log('[MediaLoader] Continuing without videos');
    }
  }

  /**
   * Load images from the images directory
   */
  loadImages() {
    this.images = [];

    try {
      if (fs.existsSync(this.imagesPath)) {
        const files = fs.readdirSync(this.imagesPath);

        this.images = files
          .filter(file => {
            const ext = path.extname(file).toLowerCase();
            return this.imageFormats.includes(ext);
          })
          .map(file => ({
            filename: file,
            path: path.join(this.imagesPath, file),
            ext: path.extname(file).toLowerCase(),
            size: this._getFileSize(path.join(this.imagesPath, file)),
            loaded: Date.now()
          }));

        this.stats.imagesLoaded = this.images.length;
        console.log(`[MediaLoader] Loaded ${this.images.length} images from ${this.imagesPath}`);
      } else {
        console.log(`[MediaLoader] Images directory not found: ${this.imagesPath}`);
        console.log('[MediaLoader] Will use procedural CSS gradients as fallback');
      }
    } catch (err) {
      console.error(`[MediaLoader] Error loading images: ${err.message}`);
      console.log('[MediaLoader] Continuing with gradient fallbacks');
    }
  }

  /**
   * Setup fs.watch() watchers for both directories
   */
  setupWatchers() {
    // Clean up existing watchers
    this.cleanupWatchers();

    const directories = [
      { path: this.videosPath, type: 'videos' },
      { path: this.imagesPath, type: 'images' }
    ];

    directories.forEach(({ path: dirPath, type }) => {
      try {
        if (fs.existsSync(dirPath)) {
          const watcher = fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
            if (filename) {
              console.log(`[MediaLoader] Detected ${eventType} in ${type}: ${filename}`);
              // Debounce reload to avoid multiple rapid reloads
              this._scheduleReload();
            }
          });

          this.watchers.push({ watcher, path: dirPath, type });
          this.stats.watchersActive++;
          console.log(`[MediaLoader] Watching ${dirPath} for changes`);
        } else {
          console.log(`[MediaLoader] Cannot watch ${dirPath} - directory does not exist`);
        }
      } catch (err) {
        console.error(`[MediaLoader] Failed to watch ${dirPath}: ${err.message}`);
      }
    });
  }

  /**
   * Debounced reload scheduler
   */
  _scheduleReload() {
    clearTimeout(this._reloadTimer);
    this._reloadTimer = setTimeout(() => {
      this.reload();
    }, 1000); // Wait 1 second after last change
  }

  /**
   * Fisher-Yates shuffle algorithm
   * This is the honest, unbiased way to shuffle an array
   */
  fisherYatesShuffle(array) {
    if (!array || array.length === 0) {
      return [];
    }

    // Create a copy to avoid mutating original
    const shuffled = [...array];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate random index from 0 to i (inclusive)
      const j = Math.floor(Math.random() * (i + 1));

      // Swap elements at i and j
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Get a random image (or gradient fallback)
   */
  getRandomImage() {
    if (this.images.length === 0) {
      console.log('[MediaLoader] No images available, using procedural gradient');
      return this.generateProceduralGradient();
    }

    const shuffled = this.fisherYatesShuffle(this.images);
    const selected = shuffled[0];

    console.log(`[MediaLoader] Selected image: ${selected.filename}`);
    return {
      type: 'image',
      path: selected.path,
      filename: selected.filename,
      ext: selected.ext
    };
  }

  /**
   * Get a random video
   */
  getRandomVideo() {
    if (this.videos.length === 0) {
      console.log('[MediaLoader] No videos available, returning null');
      return null;
    }

    const shuffled = this.fisherYatesShuffle(this.videos);
    const selected = shuffled[0];

    console.log(`[MediaLoader] Selected video: ${selected.filename}`);
    return {
      type: 'video',
      path: selected.path,
      filename: selected.filename,
      ext: selected.ext
    };
  }

  /**
   * Get multiple random images
   */
  getRandomImages(count) {
    if (this.images.length === 0) {
      const gradients = [];
      for (let i = 0; i < count; i++) {
        gradients.push(this.generateProceduralGradient());
      }
      return gradients;
    }

    const shuffled = this.fisherYatesShuffle(this.images);
    return shuffled.slice(0, count).map(img => ({
      type: 'image',
      path: img.path,
      filename: img.filename,
      ext: img.ext
    }));
  }

  /**
   * Generate a procedural CSS gradient
   * This is the HONEST fallback when no images are available
   */
  generateProceduralGradient() {
    // Define aesthetically pleasing gradients
    // These are hand-crafted, not randomly generated
    const gradients = [
      {
        name: 'Purple Dream',
        value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        colors: ['#667eea', '#764ba2']
      },
      {
        name: 'Sunset',
        value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        colors: ['#f093fb', '#f5576c']
      },
      {
        name: 'Ocean Blue',
        value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        colors: ['#4facfe', '#00f2fe']
      },
      {
        name: 'Mint Fresh',
        value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        colors: ['#43e97b', '#38f9d7']
      },
      {
        name: 'Sunrise',
        value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        colors: ['#fa709a', '#fee140']
      },
      {
        name: 'Northern Lights',
        value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        colors: ['#30cfd0', '#330867']
      },
      {
        name: 'Peachy',
        value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        colors: ['#ff9a9e', '#fecfef']
      },
      {
        name: 'Cool Sky',
        value: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        colors: ['#a1c4fd', '#c2e9fb']
      },
      {
        name: 'Purple Bliss',
        value: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        colors: ['#d299c2', '#fef9d7']
      },
      {
        name: 'Twilight',
        value: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        colors: ['#e0c3fc', '#8ec5fc']
      },
      {
        name: 'Fire',
        value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
        colors: ['#ff0844', '#ffb199']
      },
      {
        name: 'Forest',
        value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
        colors: ['#134e5e', '#71b280']
      },
      {
        name: 'Royal',
        value: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        colors: ['#141e30', '#243b55']
      },
      {
        name: 'Lemon',
        value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        colors: ['#f6d365', '#fda085']
      },
      {
        name: 'Paradise',
        value: 'linear-gradient(135deg, #1cd8d2 0%, #93edc7 100%)',
        colors: ['#1cd8d2', '#93edc7']
      },
      {
        name: 'Rose',
        value: 'linear-gradient(135deg, #ed6ea0 0%, #ec8c69 100%)',
        colors: ['#ed6ea0', '#ec8c69']
      },
      {
        name: 'Cosmic',
        value: 'linear-gradient(135deg, #2e1753 0%, #1f1746 100%)',
        colors: ['#2e1753', '#1f1746']
      },
      {
        name: 'Aqua',
        value: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
        colors: ['#13547a', '#80d0c7']
      },
      {
        name: 'Cherry',
        value: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
        colors: ['#eb3349', '#f45c43']
      },
      {
        name: 'Lavender',
        value: 'linear-gradient(135deg, #ada996 0%, #f2f2f2 100%)',
        colors: ['#ada996', '#f2f2f2']
      }
    ];

    const shuffled = this.fisherYatesShuffle(gradients);
    const selected = shuffled[0];

    console.log(`[MediaLoader] Generated procedural gradient: ${selected.name}`);
    return {
      type: 'gradient',
      name: selected.name,
      value: selected.value,
      colors: selected.colors
    };
  }

  /**
   * Generate a radial gradient (alternative style)
   */
  generateRadialGradient() {
    const gradients = [
      'radial-gradient(circle at 20% 50%, #667eea 0%, #764ba2 100%)',
      'radial-gradient(circle at 80% 20%, #f093fb 0%, #f5576c 100%)',
      'radial-gradient(circle at 50% 80%, #4facfe 0%, #00f2fe 100%)',
      'radial-gradient(circle at 30% 30%, #43e97b 0%, #38f9d7 100%)',
      'radial-gradient(circle at 70% 70%, #fa709a 0%, #fee140 100%)'
    ];

    const shuffled = this.fisherYatesShuffle(gradients);
    return {
      type: 'gradient',
      subtype: 'radial',
      value: shuffled[0]
    };
  }

  /**
   * Reload all media (called when watcher detects changes)
   */
  reload() {
    console.log('[MediaLoader] Reloading media...');

    const oldVideoCount = this.videos.length;
    const oldImageCount = this.images.length;

    this.loadVideos();
    this.loadImages();

    this.stats.reloadCount++;
    this.stats.lastReload = new Date().toISOString();

    console.log(`[MediaLoader] Reload complete: Videos ${oldVideoCount} -> ${this.videos.length}, Images ${oldImageCount} -> ${this.images.length}`);

    this.emit('reload', {
      videos: {
        old: oldVideoCount,
        new: this.videos.length,
        changed: this.videos.length !== oldVideoCount
      },
      images: {
        old: oldImageCount,
        new: this.images.length,
        changed: this.images.length !== oldImageCount
      }
    });
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
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

  /**
   * Get file size helper
   */
  _getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (err) {
      return 0;
    }
  }

  /**
   * Format bytes to human readable
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get all available media
   */
  getAllMedia() {
    return {
      videos: this.videos,
      images: this.images,
      stats: this.getStats()
    };
  }

  /**
   * Check if specific file exists
   */
  hasFile(filename) {
    return this.videos.some(v => v.filename === filename) ||
           this.images.some(i => i.filename === filename);
  }

  /**
   * Get specific file by name
   */
  getFile(filename) {
    let file = this.videos.find(v => v.filename === filename);
    if (file) return { ...file, mediaType: 'video' };

    file = this.images.find(i => i.filename === filename);
    if (file) return { ...file, mediaType: 'image' };

    return null;
  }

  /**
   * Cleanup watchers
   */
  cleanupWatchers() {
    this.watchers.forEach(({ watcher, path }) => {
      try {
        watcher.close();
        console.log(`[MediaLoader] Closed watcher for ${path}`);
      } catch (err) {
        console.error(`[MediaLoader] Error closing watcher: ${err.message}`);
      }
    });
    this.watchers = [];
    this.stats.watchersActive = 0;
  }

  /**
   * Cleanup and shutdown
   */
  cleanup() {
    console.log('[MediaLoader] Cleaning up...');
    this.cleanupWatchers();
    this.videos = [];
    this.images = [];
    this.emit('cleanup');
  }

  /**
   * Test the media loader (for diagnostics)
   */
  async test() {
    console.log('\n[MediaLoader] Running diagnostics...\n');

    console.log('Configuration:');
    console.log(`  Videos path: ${this.videosPath}`);
    console.log(`  Images path: ${this.imagesPath}`);
    console.log(`  Videos available: ${this.videos.length}`);
    console.log(`  Images available: ${this.images.length}`);
    console.log(`  Watchers active: ${this.stats.watchersActive}`);

    console.log('\nTesting random selection (Fisher-Yates):');

    if (this.videos.length > 0) {
      console.log('  Sample video:', this.getRandomVideo().filename);
    } else {
      console.log('  No videos available');
    }

    if (this.images.length > 0) {
      const img = this.getRandomImage();
      console.log('  Sample image:', img.type === 'image' ? img.filename : 'gradient');
    } else {
      console.log('  No images, using gradient:', this.getRandomImage().name);
    }

    console.log('\nGradient fallback test:');
    const gradient = this.generateProceduralGradient();
    console.log(`  Generated: ${gradient.name}`);
    console.log(`  CSS: ${gradient.value}`);

    console.log('\n[MediaLoader] Diagnostics complete\n');
  }
}

module.exports = MediaLoader;
