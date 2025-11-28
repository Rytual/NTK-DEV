/**
 * ThreeJSAnimations - Honest Three.js Procedural Animations
 *
 * This module creates ALL visuals procedurally using Three.js geometry.
 * NO external model loading, NO fake assets, ONLY parametric geometry.
 *
 * Features:
 * - Procedural geometric shapes
 * - Particle systems
 * - Text rendering
 * - Dynamic lighting
 * - Camera animations
 * - Material effects
 */

const THREE = require('three');

/**
 * ThreeJS Animation Manager
 */
class ThreeJSAnimationManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationId = null;
    this.objects = [];
    this.particles = null;
    this.time = 0;

    this.initialize();
  }

  /**
   * Initialize Three.js scene
   */
  initialize() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e27);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 30;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Add lights
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);

    // Point lights for dynamic effects
    const pointLight1 = new THREE.PointLight(0x4444ff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff4444, 1, 100);
    pointLight2.position.set(-10, -10, 10);
    this.scene.add(pointLight2);
  }

  /**
   * Create floating geometric shapes (for background)
   */
  createFloatingShapes(count = 50) {
    const geometries = [
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.ConeGeometry(0.5, 1, 16),
      new THREE.TorusGeometry(0.5, 0.2, 16, 100),
      new THREE.OctahedronGeometry(0.6, 0),
      new THREE.TetrahedronGeometry(0.7, 0),
      new THREE.DodecahedronGeometry(0.6, 0),
      new THREE.IcosahedronGeometry(0.6, 0)
    ];

    for (let i = 0; i < count; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({
        color: Math.random() * 0xffffff,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.4,
        wireframe: Math.random() > 0.5
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Random position
      mesh.position.x = (Math.random() - 0.5) * 100;
      mesh.position.y = (Math.random() - 0.5) * 100;
      mesh.position.z = (Math.random() - 0.5) * 100;

      // Random rotation
      mesh.rotation.x = Math.random() * Math.PI * 2;
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = Math.random() * Math.PI * 2;

      // Random scale
      const scale = 0.5 + Math.random() * 2;
      mesh.scale.set(scale, scale, scale);

      // Store animation data
      mesh.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: Math.random() * 0.01,
        floatOffset: Math.random() * Math.PI * 2
      };

      this.scene.add(mesh);
      this.objects.push(mesh);
    }
  }

  /**
   * Create particle system
   */
  createParticleSystem(count = 1000) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];

    for (let i = 0; i < count; i++) {
      // Random position
      positions.push((Math.random() - 0.5) * 200);
      positions.push((Math.random() - 0.5) * 200);
      positions.push((Math.random() - 0.5) * 200);

      // Random color
      const color = new THREE.Color();
      color.setHSL(Math.random(), 0.7, 0.5);
      colors.push(color.r, color.g, color.b);

      // Random size
      sizes.push(Math.random() * 3 + 1);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  /**
   * Create achievement badge (procedural 3D badge)
   */
  createAchievementBadge(achievement) {
    const group = new THREE.Group();

    // Badge base (cylinder)
    const baseGeometry = new THREE.CylinderGeometry(2, 2, 0.3, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: this.getAchievementColor(achievement.tier),
      metalness: 0.8,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);

    // Badge rim
    const rimGeometry = new THREE.TorusGeometry(2.1, 0.15, 16, 100);
    const rimMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      metalness: 1,
      roughness: 0
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    // Badge center decoration (star for example)
    const starGeometry = this.createStarGeometry(1, 0.5, 5);
    const starMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.z = 0.2;
    group.add(star);

    // Add particles around badge
    this.addBadgeParticles(group);

    // Position and animate
    group.position.set(0, 0, 0);
    group.rotation.y = Math.PI / 4;

    return group;
  }

  /**
   * Create star geometry (procedural)
   */
  createStarGeometry(outerRadius, innerRadius, points) {
    const shape = new THREE.Shape();
    const angle = Math.PI / points;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(i * angle) * radius;
      const y = Math.sin(i * angle) * radius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }

  /**
   * Add particle effect to badge
   */
  addBadgeParticles(group) {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 3 + Math.random();
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 2
      );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.15,
      transparent: true,
      opacity: 0.6
    });

    const particles = new THREE.Points(geometry, material);
    group.add(particles);
  }

  /**
   * Get achievement tier color
   */
  getAchievementColor(tier) {
    const colors = {
      bronze: 0xcd7f32,
      silver: 0xc0c0c0,
      gold: 0xffd700,
      platinum: 0xe5e4e2,
      diamond: 0xb9f2ff
    };
    return colors[tier] || 0x4444ff;
  }

  /**
   * Create level-up animation
   */
  createLevelUpAnimation(level) {
    const group = new THREE.Group();

    // Central sphere with pulsing effect
    const sphereGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x4444ff,
      emissive: 0x2222ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);

    // Rotating rings
    for (let i = 0; i < 3; i++) {
      const ringGeometry = new THREE.TorusGeometry(4 + i, 0.2, 16, 100);
      const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * Math.PI / 6);
      ring.userData = { rotationSpeed: 0.02 + i * 0.01 };
      group.add(ring);
    }

    // Explosion particles
    this.createExplosionParticles(group);

    return group;
  }

  /**
   * Create explosion particle effect
   */
  createExplosionParticles(group) {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push(0, 0, 0);

      // Random velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.1 + Math.random() * 0.2;

      velocities.push(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffff00,
      size: 0.3,
      transparent: true,
      opacity: 1
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = { isExplosion: true, age: 0 };
    group.add(particles);
  }

  /**
   * Create streak visualization (fire-like effect)
   */
  createStreakVisualization(streakCount) {
    const group = new THREE.Group();

    // Flame base (cone)
    const coneGeometry = new THREE.ConeGeometry(1.5, 4, 32);
    const coneMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4500,
      emissive: 0xff6600,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = -2;
    group.add(cone);

    // Flame tip
    const tipGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const tipMaterial = new THREE.MeshPhongMaterial({
      color: 0xffff00,
      emissive: 0xffaa00,
      emissiveIntensity: 1
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.y = 1;
    group.add(tip);

    // Flame particles
    this.createFlameParticles(group, streakCount);

    return group;
  }

  /**
   * Create flame particle effect
   */
  createFlameParticles(group, intensity) {
    const particleCount = intensity * 10;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 2;
      const height = Math.random() * 5;

      positions.push(
        Math.cos(angle) * radius,
        height - 2,
        Math.sin(angle) * radius
      );

      // Color gradient from red to yellow
      const color = new THREE.Color();
      color.setHSL(0.05 + Math.random() * 0.1, 1, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    particles.userData = { isFlame: true };
    group.add(particles);
  }

  /**
   * Create progress ring
   */
  createProgressRing(progress, radius = 5) {
    const group = new THREE.Group();

    // Background ring
    const bgGeometry = new THREE.TorusGeometry(radius, 0.3, 16, 100);
    const bgMaterial = new THREE.MeshPhongMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.3
    });
    const bgRing = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(bgRing);

    // Progress ring (partial torus)
    const progressAngle = (progress / 100) * Math.PI * 2;
    const progressCurve = new THREE.EllipseCurve(
      0, 0,
      radius, radius,
      0, progressAngle,
      false,
      0
    );

    const points = progressCurve.getPoints(50);
    const progressGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const progressMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 5
    });

    const progressLine = new THREE.Line(progressGeometry, progressMaterial);
    group.add(progressLine);

    return group;
  }

  /**
   * Create XP orb (floating sphere with particle trail)
   */
  createXPOrb(xpAmount) {
    const group = new THREE.Group();

    // Main orb
    const orbGeometry = new THREE.SphereGeometry(1, 32, 32);
    const orbMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.9
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    group.add(orb);

    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Particle trail
    this.createOrbTrail(group);

    return group;
  }

  /**
   * Create particle trail for orb
   */
  createOrbTrail(group) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5;
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.2,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const trail = new THREE.Points(geometry, material);
    trail.userData = { isTrail: true };
    group.add(trail);
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Animate floating shapes
    this.objects.forEach(obj => {
      if (obj.userData.rotationSpeed) {
        obj.rotation.x += obj.userData.rotationSpeed.x;
        obj.rotation.y += obj.userData.rotationSpeed.y;
        obj.rotation.z += obj.userData.rotationSpeed.z;
      }

      if (obj.userData.floatSpeed) {
        obj.position.y += Math.sin(this.time + obj.userData.floatOffset) * obj.userData.floatSpeed;
      }
    });

    // Animate particles
    if (this.particles) {
      this.particles.rotation.y += 0.001;
      this.particles.rotation.x += 0.0005;
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Start animation
   */
  start() {
    this.animate();
  }

  /**
   * Stop animation
   */
  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.container) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Clean up
   */
  cleanup() {
    this.stop();

    // Dispose geometries and materials
    this.objects.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.container && this.renderer.domElement) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = [];
    this.particles = null;
  }
}

module.exports = ThreeJSAnimationManager;
