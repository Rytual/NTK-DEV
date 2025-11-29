/**
 * useMediaLoader Hook
 *
 * React hook for accessing the MediaLoader system via IPC.
 * Provides images and videos from the art/ directory for UI backgrounds.
 *
 * Features:
 * - Random image/video selection on mount
 * - Aspect ratio detection for image categorization
 * - Auto-reload when media changes
 * - Settings integration for rotation preferences
 */

import * as React from 'react';

// Types for media items
export interface MediaItem {
  type: 'image' | 'video' | 'gradient';
  path?: string;
  filename?: string;
  ext?: string;
  name?: string;
  value?: string;
  colors?: string[];
}

export interface MediaStats {
  videosLoaded: number;
  imagesLoaded: number;
  reloadCount: number;
  lastReload: string | null;
  watchersActive: number;
  directories: {
    videos: string;
    images: string;
  };
  available: {
    videos: number;
    images: number;
  };
  usingFallbacks: {
    videos: boolean;
    images: boolean;
  };
}

export interface UseMediaLoaderOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Convert filesystem path to ninja-art:// URL for secure loading
// This uses a custom protocol registered in main.ts
function pathToArtUrl(filePath: string): string {
  if (!filePath) return '';

  // Extract the relative path from the full filesystem path
  // Full path: C:\Dev\NinjaToolKit-FinalMerge\art\images\filename.jpg
  // We need: images/filename.jpg

  const normalizedPath = filePath.replace(/\\/g, '/');

  // Find the 'art/' part and extract everything after it
  const artIndex = normalizedPath.indexOf('/art/');
  if (artIndex !== -1) {
    const relativePath = normalizedPath.slice(artIndex + 5); // +5 to skip '/art/'
    // Split into type and filename, encode filename for URL safety
    const slashIndex = relativePath.indexOf('/');
    if (slashIndex !== -1) {
      const type = relativePath.slice(0, slashIndex); // 'images' or 'videos'
      const filename = relativePath.slice(slashIndex + 1);
      // Encode filename but keep the URL structure intact
      return `ninja-art://${type}/${encodeURIComponent(filename)}`;
    }
    return `ninja-art://${encodeURIComponent(relativePath)}`;
  }

  // Fallback: try to extract just the last two parts (type/filename)
  const parts = normalizedPath.split('/');
  if (parts.length >= 2) {
    const type = parts[parts.length - 2]; // 'images' or 'videos'
    const filename = parts[parts.length - 1];
    return `ninja-art://${type}/${encodeURIComponent(filename)}`;
  }

  return '';
}

/**
 * Main hook for accessing media
 */
export function useMediaLoader(options: UseMediaLoaderOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [backgroundImage, setBackgroundImage] = React.useState<MediaItem | null>(null);
  const [headerVideo, setHeaderVideo] = React.useState<MediaItem | null>(null);
  const [chatBackground, setChatBackground] = React.useState<MediaItem | null>(null);
  const [stats, setStats] = React.useState<MediaStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load initial media on mount
  const loadMedia = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('electronAPI not available');
      }

      // Fetch random image for background
      const bgImage = await window.electronAPI.invoke('media:getRandomImage') as MediaItem | null;
      setBackgroundImage(bgImage);

      // Fetch random video for header
      const video = await window.electronAPI.invoke('media:getRandomVideo') as MediaItem | null;
      setHeaderVideo(video);

      // Fetch another random image for chat (preferably square)
      const chatImg = await window.electronAPI.invoke('media:getRandomImage') as MediaItem | null;
      setChatBackground(chatImg);

      // Fetch stats
      const mediaStats = await window.electronAPI.invoke('media:getStats') as MediaStats | null;
      setStats(mediaStats);

    } catch (err) {
      console.error('[useMediaLoader] Error loading media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Auto-refresh interval
  React.useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      loadMedia();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, loadMedia]);

  // Listen for media reload events from main process
  React.useEffect(() => {
    if (!window.electronAPI) return;

    const unsubscribe = window.electronAPI.on('media:reload', () => {
      console.log('[useMediaLoader] Media reloaded, refreshing...');
      loadMedia();
    });

    return unsubscribe;
  }, [loadMedia]);

  // Get background CSS for an image item
  const getBackgroundStyle = React.useCallback((item: MediaItem | null): React.CSSProperties => {
    console.log('[useMediaLoader] getBackgroundStyle called with item:', item);

    if (!item) {
      console.log('[useMediaLoader] No item, using fallback gradient');
      return {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
      };
    }

    if (item.type === 'gradient') {
      console.log('[useMediaLoader] Using gradient:', item.value);
      return {
        background: item.value || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
    }

    if (item.type === 'image' && item.path) {
      const artUrl = pathToArtUrl(item.path);
      console.log('[useMediaLoader] Generated ninja-art URL:', artUrl);
      console.log('[useMediaLoader] Original path was:', item.path);
      return {
        backgroundImage: `url("${artUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    console.log('[useMediaLoader] Unknown item type, using fallback');
    return {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    };
  }, []);

  // Get video source URL
  const getVideoUrl = React.useCallback((item: MediaItem | null): string | null => {
    if (!item || item.type !== 'video' || !item.path) {
      return null;
    }
    const artUrl = pathToArtUrl(item.path);
    console.log('[useMediaLoader] Video URL:', artUrl);
    return artUrl;
  }, []);

  // Refresh specific media type
  const refreshBackground = React.useCallback(async () => {
    if (!window.electronAPI) return;
    const bgImage = await window.electronAPI.invoke('media:getRandomImage') as MediaItem | null;
    setBackgroundImage(bgImage);
  }, []);

  const refreshVideo = React.useCallback(async () => {
    if (!window.electronAPI) return;
    const video = await window.electronAPI.invoke('media:getRandomVideo') as MediaItem | null;
    setHeaderVideo(video);
  }, []);

  const refreshChatBackground = React.useCallback(async () => {
    if (!window.electronAPI) return;
    const chatImg = await window.electronAPI.invoke('media:getRandomImage') as MediaItem | null;
    setChatBackground(chatImg);
  }, []);

  return {
    // Media items
    backgroundImage,
    headerVideo,
    chatBackground,

    // Stats
    stats,

    // State
    loading,
    error,

    // Utilities
    getBackgroundStyle,
    getVideoUrl,
    pathToArtUrl,

    // Actions
    refresh: loadMedia,
    refreshBackground,
    refreshVideo,
    refreshChatBackground,
  };
}

/**
 * Simplified hook for just background image
 */
export function useBackgroundImage() {
  const { backgroundImage, getBackgroundStyle, loading, refreshBackground } = useMediaLoader();

  return {
    image: backgroundImage,
    style: getBackgroundStyle(backgroundImage),
    loading,
    refresh: refreshBackground,
  };
}

/**
 * Simplified hook for just video
 */
export function useHeaderVideo() {
  const { headerVideo, getVideoUrl, loading, refreshVideo } = useMediaLoader();

  return {
    video: headerVideo,
    url: getVideoUrl(headerVideo),
    loading,
    refresh: refreshVideo,
  };
}

export default useMediaLoader;
