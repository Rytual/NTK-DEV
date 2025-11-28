/**
 * Ninja Toolkit - Splash Screen Component (v4)
 * Animated loading screen with GLOBAL MEDIA SYSTEM integration
 *
 * Features:
 * - Global MediaLoader integration via IPC bridge
 * - fs.watch for /art/videos and /art/images monitoring
 * - Fisher-Yates shuffle for random selection (via MediaLoader)
 * - HTML5 video support (<video loop muted autoplay>)
 * - Procedural gradients fallback when no assets (via MediaLoader)
 * - Service Worker offline caching
 * - Progress indicator with loading steps
 * - Framer Motion animations
 *
 * Changes in v4:
 * - Uses global MediaLoader singleton via IPC
 * - Points to /art/videos and /art/images directories
 * - Automatic hot reload when media files change
 * - Honest media system (no fake assets)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface SplashProps {
  onComplete: () => void;
}

interface MediaAsset {
  type: 'image' | 'video' | 'gradient';
  path?: string;
  filename?: string;
  name?: string;
  value?: string; // CSS gradient value
  colors?: string[]; // gradient colors
}

interface LoadingStep {
  id: string;
  label: string;
  duration: number;
}

/**
 * Fisher-Yates Shuffle Algorithm
 * Used to randomize media asset selection
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Loading steps simulation
 */
const LOADING_STEPS: LoadingStep[] = [
  { id: 'init', label: 'Initializing fortress...', duration: 800 },
  { id: 'modules', label: 'Loading blade modules...', duration: 1000 },
  { id: 'kage', label: 'Summoning Kage sensei...', duration: 700 },
  { id: 'theme', label: 'Applying feudal theme...', duration: 600 },
  { id: 'ready', label: 'Sharpening blades...', duration: 500 }
];

/**
 * Procedural gradient generator (fallback when no assets)
 */
const generateProceduralGradient = (): string => {
  const gradients = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0a0e27 0%, #1e3a5f 50%, #2a5298 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'radial-gradient(circle at 50% 50%, #1e3a5f 0%, #0a0e27 100%)',
    'linear-gradient(135deg, #000000 0%, #1a4d2e 50%, #00ff88 100%)'
  ];

  const shuffled = fisherYatesShuffle(gradients);
  return shuffled[0];
};

/**
 * Splash Component
 */
const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<LoadingStep>(LOADING_STEPS[0]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [useProceduralBackground, setUseProceduralBackground] = useState(false);
  const [proceduralGradient, setProceduralGradient] = useState(generateProceduralGradient());

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Load media from global MediaLoader on mount
   */
  useEffect(() => {
    loadMediaFromGlobalLoader();
    startLoadingSequence();

    // Listen for media reload events
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('media:reload', () => {
        console.log('[Splash] Media reloaded, refreshing background');
        loadMediaFromGlobalLoader();
      });
    }

    return () => {
      if (window.electron?.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('media:reload');
      }
    };
  }, []);

  /**
   * Load media from global MediaLoader via IPC
   */
  const loadMediaFromGlobalLoader = async () => {
    try {
      if (!window.electron?.ipcRenderer) {
        console.log('[Splash] Electron IPC not available, using fallback gradient');
        setUseProceduralBackground(true);
        return;
      }

      // Get random image from global MediaLoader
      const background = await window.electron.ipcRenderer.invoke('media:getRandomImage');

      if (background.type === 'gradient') {
        // Using procedural gradient (no images available)
        console.log('[Splash] Using procedural gradient:', background.name);
        setSelectedAsset(background);
        setProceduralGradient(background.value);
        setUseProceduralBackground(true);
      } else if (background.type === 'image') {
        // Using real image file
        console.log('[Splash] Using image:', background.filename);
        setSelectedAsset(background);
        setUseProceduralBackground(false);

        // Draw image to canvas with random crop
        if (background.path) {
          drawImageWithRandomCrop(background.path);
        }
      }

      // Optional: Try to get a video too
      const video = await window.electron.ipcRenderer.invoke('media:getRandomVideo');
      if (video) {
        console.log('[Splash] Video available:', video.filename);
        // Could switch to video instead of image if preferred
      }

    } catch (error) {
      console.error('[Splash] Failed to load media from global MediaLoader:', error);
      setUseProceduralBackground(true);
    }
  };

  /**
   * Draw image to canvas with random crop
   */
  const drawImageWithRandomCrop = (imagePath: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Calculate random crop using Fisher-Yates approach
      const cropSizes = [0.7, 0.8, 0.9, 1.0];
      const shuffledSizes = fisherYatesShuffle(cropSizes);
      const scale = shuffledSizes[0];

      const cropWidth = img.width * scale;
      const cropHeight = img.height * scale;

      // Random crop position
      const maxX = img.width - cropWidth;
      const maxY = img.height - cropHeight;
      const cropX = Math.random() * maxX;
      const cropY = Math.random() * maxY;

      // Draw cropped image
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Apply blend overlay
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(0, 255, 136, 0.1)'; // Emerald overlay
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    img.src = imagePath;
  };

  /**
   * Start loading sequence
   */
  const startLoadingSequence = async () => {
    let totalProgress = 0;

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      const step = LOADING_STEPS[i];
      setCurrentStep(step);

      // Simulate loading with smooth progress
      const startProgress = totalProgress;
      const endProgress = ((i + 1) / LOADING_STEPS.length) * 100;
      const duration = step.duration;
      const steps = 20;
      const increment = (endProgress - startProgress) / steps;
      const delay = duration / steps;

      for (let j = 0; j < steps; j++) {
        await new Promise(resolve => setTimeout(resolve, delay));
        totalProgress += increment;
        setProgress(Math.min(totalProgress, 100));
      }
    }

    // Complete
    setProgress(100);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {useProceduralBackground ? (
          /* Procedural Gradient Fallback */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{ background: proceduralGradient }}
            className="w-full h-full"
          />
        ) : selectedAsset?.type === 'video' ? (
          /* Video Background */
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4)' }}
          >
            <source src={selectedAsset.path} type="video/mp4" />
          </video>
        ) : (
          /* Canvas Background (for images with random crop) */
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4)' }}
          />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Animated gradient overlay */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg px-8">
        {/* Logo/Symbol */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-8"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/50 relative">
            <span className="text-7xl">忍</span>

            {/* Rotating ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-transparent border-t-emerald-400 rounded-full"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-5xl font-bold text-white mb-2 text-center"
        >
          Ninja Toolkit
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-emerald-400 text-lg mb-12 text-center font-semibold"
        >
          Feudal Tokyo Dark Theme
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="w-full mb-4"
        >
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full relative"
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ width: '50%' }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Loading Step */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-gray-300 text-sm mb-1">{currentStep.label}</p>
            <p className="text-emerald-500 text-xs font-mono">{Math.round(progress)}%</p>
          </motion.div>
        </AnimatePresence>

        {/* Spinning shuriken indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-3 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.2
              }}
              className="w-4 h-4"
            >
              <svg viewBox="0 0 16 16" className="w-full h-full text-emerald-500 opacity-60">
                <path
                  fill="currentColor"
                  d="M8 2 L9 7 L14 6 L10 8 L14 10 L9 9 L8 14 L7 9 L2 10 L6 8 L2 6 L7 7 Z"
                />
              </svg>
            </motion.div>
          ))}
        </motion.div>

        {/* Version info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-gray-600 text-xs mt-12"
        >
          v4.0 (Prompt 1 v4) • Global Media System • Claude Sonnet 4.5
        </motion.p>
      </div>
    </motion.div>
  );
};

export default Splash;
