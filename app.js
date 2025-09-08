// Lunai 3D Landing Page - Enhanced with Kyutai TTS and 3D Background
// Eclipse of Tomorrow - Refined Logo with Chrome Finish and Clear Visibility

// 3D Background Manager using Three.js with GLB Model Support
class ThreeJSBackground {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
    this.animationId = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.particles = [];
    this.geometries = [];
    this.materials = [];
    this.meshes = [];
    this.time = 0;
    this.gltfLoader = null;
    this.wonderfulWorldModel = null;
    this.modelLoaded = false;
    
    this.init();
  }
  
  init() {
    // Get canvas element
    this.canvas = document.getElementById('threejs-canvas');
    if (!this.canvas) {
      console.warn('Three.js canvas element not found');
      return;
    }
    
    try {
      this.setupScene();
      this.setupLoader();
      this.addTestCube(); // Add a test cube to verify Three.js is working
      this.loadWonderfulWorldModel();
      this.createParticleSystem();
      this.createNebula();
      this.setupLighting();
      this.setupEventListeners();
      this.animate();
      console.log('Three.js 3D background initialized successfully');
    } catch (error) {
      console.warn('Three.js initialization failed:', error);
    }
  }
  
  addTestCube() {
    // Add a simple test cube to verify Three.js rendering
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x00ff00,
      emissive: 0x002200,
      emissiveIntensity: 0.5
    });
    const testCube = new THREE.Mesh(geometry, material);
    testCube.position.set(-8, 0, 0); // Position to the left
    
    testCube.userData = {
      rotationSpeed: { x: 0.01, y: 0.01, z: 0 }
    };
    
    this.scene.add(testCube);
    this.meshes.push(testCube);
    this.geometries.push(geometry);
    this.materials.push(material);
    
    console.log('Test cube added at position:', testCube.position);
  }
  
  setupScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.0002); // Much lighter fog for better model visibility
    
    // Create camera with better positioning for the model
    this.camera = new THREE.PerspectiveCamera(
      60, // Reduced FOV for better view
      window.innerWidth / window.innerHeight,
      0.1,
      2000 // Increased far clipping for large models
    );
    this.camera.position.set(0, 5, 15); // Better position to see the whole model
    this.camera.lookAt(0, 0, 0); // Look at scene center
    
    // Create renderer with enhanced settings
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding; // Better color reproduction
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2; // Brighter exposure
  }
  
  setupLoader() {
    // Initialize GLTF Loader
    this.gltfLoader = new THREE.GLTFLoader();
  }
  
  loadWonderfulWorldModel() {
    console.log('Loading wonderful_world.glb model...');
    
    // Show loading indicator
    const loadingIndicator = document.getElementById('model-loading');
    const canvas = document.getElementById('threejs-canvas');
    
    this.gltfLoader.load(
      './wonderful_world.glb',
      (gltf) => {
        console.log('GLB model loaded successfully:', gltf);
        console.log('Model scene children:', gltf.scene.children.length);
        
        this.wonderfulWorldModel = gltf.scene;
        
        // Debug: Log model properties before setup
        console.log('Model before setup - Position:', this.wonderfulWorldModel.position);
        console.log('Model before setup - Scale:', this.wonderfulWorldModel.scale);
        console.log('Model before setup - Visible:', this.wonderfulWorldModel.visible);
        
        // Configure the model
        this.setupModel();
        
        // Debug: Log model properties after setup
        console.log('Model after setup - Position:', this.wonderfulWorldModel.position);
        console.log('Model after setup - Scale:', this.wonderfulWorldModel.scale);
        console.log('Model after setup - Visible:', this.wonderfulWorldModel.visible);
        
        // Add to scene
        this.scene.add(this.wonderfulWorldModel);
        this.modelLoaded = true;
        
        // Debug: Check scene contents
        console.log('Scene children after adding model:', this.scene.children.length);
        
        // Add model to meshes for animation
        this.meshes.push(this.wonderfulWorldModel);
        
        // Force a render to see if model appears
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
          console.log('Forced initial render completed');
        }
        
        // Hide loading indicator and show canvas
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          setTimeout(() => {
            loadingIndicator.style.display = 'none';
          }, 500);
        }
        
        if (canvas) {
          canvas.classList.remove('loading');
          canvas.classList.add('loaded');
        }
        
        console.log('Wonderful World model setup complete and added to scene');
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total * 100));
        console.log('Loading progress:', percent + '%');
        
        // Update loading text
        if (loadingIndicator) {
          const loadingText = loadingIndicator.querySelector('p');
          if (loadingText) {
            loadingText.textContent = `Loading Wonderful World... ${percent}%`;
          }
        }
      },
      (error) => {
        console.error('Error loading GLB model:', error);
        
        // Hide loading indicator
        if (loadingIndicator) {
          loadingIndicator.classList.add('hidden');
          setTimeout(() => {
            loadingIndicator.style.display = 'none';
          }, 500);
        }
        
        // Show canvas even if model fails
        if (canvas) {
          canvas.classList.remove('loading');
          canvas.classList.add('loaded');
        }
        
        // Fallback to procedural geometry if model fails to load
        this.createFallbackGeometry();
      }
    );
  }
  
  setupModel() {
    if (!this.wonderfulWorldModel) return;
    
    // First, let's analyze the model size and center it properly
    const box = new THREE.Box3().setFromObject(this.wonderfulWorldModel);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    console.log('Model size:', size);
    console.log('Model center:', center);
    
    // Center the model
    this.wonderfulWorldModel.position.sub(center);
    
    // Scale the model based on its current size
    const maxDimension = Math.max(size.x, size.y, size.z);
    const desiredSize = 8; // Desired size for visibility
    const scale = desiredSize / maxDimension;
    this.wonderfulWorldModel.scale.setScalar(scale);
    
    // Position the model for better visibility
    this.wonderfulWorldModel.position.set(0, 0, 0);
    
    console.log('Applied scale:', scale);
    console.log('Final position:', this.wonderfulWorldModel.position);
    
    // Configure materials for visibility
    this.wonderfulWorldModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Force material visibility
        if (child.material) {
          // Handle different material types
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => this.enhanceMaterial(mat));
          } else {
            this.enhanceMaterial(child.material);
          }
        }
      }
    });
    
    // Store animation data
    this.wonderfulWorldModel.userData = {
      originalRotation: {
        x: this.wonderfulWorldModel.rotation.x,
        y: this.wonderfulWorldModel.rotation.y,
        z: this.wonderfulWorldModel.rotation.z
      },
      rotationSpeed: {
        x: 0,
        y: 0.005, // Slightly faster rotation for visibility
        z: 0
      }
    };
    
    // Make sure model is visible by checking its visibility
    this.wonderfulWorldModel.visible = true;
    console.log('Model setup complete. Visible:', this.wonderfulWorldModel.visible);
    
    // Add debug helper - temporary wireframe toggle
    window.toggleWireframe = () => {
      if (this.wonderfulWorldModel) {
        this.wonderfulWorldModel.traverse((child) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.wireframe = !mat.wireframe;
                mat.needsUpdate = true;
              });
            } else {
              child.material.wireframe = !child.material.wireframe;
              child.material.needsUpdate = true;
            }
          }
        });
        console.log('Wireframe toggled');
      }
    };
    
    // Add debug info to console
    console.log('Model debug info:');
    console.log('- Position:', this.wonderfulWorldModel.position);
    console.log('- Scale:', this.wonderfulWorldModel.scale);
    console.log('- Rotation:', this.wonderfulWorldModel.rotation);
    console.log('- Visible:', this.wonderfulWorldModel.visible);
    console.log('- Children count:', this.wonderfulWorldModel.children.length);
    console.log('Call toggleWireframe() in console to see wireframe mode');
  }
  
  enhanceMaterial(material) {
    // Ensure material is visible and properly lit
    material.transparent = false;
    material.opacity = 1.0;
    material.side = THREE.DoubleSide; // Render both sides
    material.wireframe = false; // Ensure solid rendering
    
    // Force bright colors for visibility
    if (material.color) {
      material.color.multiplyScalar(1.5); // Brighten existing colors
    }
    
    // Add strong emission for visibility in dark scenes
    if (material.emissive) {
      material.emissive.setHex(0x223344);
      material.emissiveIntensity = 0.4;
    } else {
      // If no emissive, try to add one
      material.emissive = new THREE.Color(0x223344);
      material.emissiveIntensity = 0.4;
    }
    
    // Enhance metallic/roughness if available (PBR materials)
    if (material.metalness !== undefined) {
      material.metalness = 0.2;
    }
    if (material.roughness !== undefined) {
      material.roughness = 0.7;
    }
    
    // Ensure material receives light properly
    material.flatShading = false;
    
    // Force material update
    material.needsUpdate = true;
    
    console.log('Enhanced material:', material.type, 'Emissive:', material.emissive, 'Color:', material.color);
  }
  
  createFallbackGeometry() {
    console.log('Creating fallback geometry...');
    // Create simple floating shapes as fallback
    this.createFloatingShapes();
  }
  
  createFloatingShapes() {
    const shapes = [
      { geometry: new THREE.IcosahedronGeometry(0.5, 1), count: 8 },
      { geometry: new THREE.OctahedronGeometry(0.3), count: 12 },
      { geometry: new THREE.TetrahedronGeometry(0.4), count: 6 },
      { geometry: new THREE.BoxGeometry(0.4, 0.4, 0.4), count: 10 }
    ];
    
    shapes.forEach((shapeConfig, shapeIndex) => {
      for (let i = 0; i < shapeConfig.count; i++) {
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color().setHSL(
            (shapeIndex * 0.25 + Math.random() * 0.1) % 1,
            0.7,
            0.5 + Math.random() * 0.3
          ),
          transparent: true,
          opacity: 0.6 + Math.random() * 0.4,
          wireframe: Math.random() > 0.7
        });
        
        const mesh = new THREE.Mesh(shapeConfig.geometry, material);
        
        // Random positioning in 3D space
        mesh.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        );
        
        // Random rotation
        mesh.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        );
        
        // Random scale
        const scale = 0.5 + Math.random() * 1.5;
        mesh.scale.set(scale, scale, scale);
        
        // Store animation properties
        mesh.userData = {
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
          },
          floatSpeed: Math.random() * 0.01 + 0.005,
          originalY: mesh.position.y
        };
        
        this.scene.add(mesh);
        this.meshes.push(mesh);
        this.geometries.push(shapeConfig.geometry);
        this.materials.push(material);
      }
    });
  }
  
  createParticleSystem() {
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Positions
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 100;
      
      // Colors
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.2 + 0.5, 0.8, 0.5 + Math.random() * 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Sizes
      sizes[i] = Math.random() * 3 + 1;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particleSystem);
    this.particles.push(particleSystem);
    this.geometries.push(particleGeometry);
    this.materials.push(particleMaterial);
  }
  
  createNebula() {
    // Create nebula-like cloud effect
    const nebulaGeometry = new THREE.SphereGeometry(15, 32, 32);
    const nebulaMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a0e4e,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.userData = {
      rotationSpeed: { x: 0.001, y: 0.002, z: 0.0015 }
    };
    
    this.scene.add(nebula);
    this.meshes.push(nebula);
    this.geometries.push(nebulaGeometry);
    this.materials.push(nebulaMaterial);
  }
  
  setupLighting() {
    // Much brighter lighting for model visibility
    
    // Strong ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5); // Increased intensity
    this.scene.add(ambientLight);
    
    // Main directional light (key light)
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0); // Much brighter
    mainLight.position.set(20, 20, 20);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 1000;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    this.scene.add(mainLight);
    
    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0x8888ff, 1.0);
    fillLight.position.set(-20, 10, -20);
    this.scene.add(fillLight);
    
    // Back light for rim lighting
    const backLight = new THREE.DirectionalLight(0xffaa88, 0.8);
    backLight.position.set(0, 10, -30);
    this.scene.add(backLight);
    
    // Multiple point lights for dynamic illumination
    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 100);
    pointLight1.position.set(15, 15, 15);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xff4081, 1.2, 80);
    pointLight2.position.set(-15, 10, -15);
    this.scene.add(pointLight2);
    
    const pointLight3 = new THREE.PointLight(0x00ff88, 1.0, 60);
    pointLight3.position.set(0, 25, 0);
    this.scene.add(pointLight3);
    
    // Hemisphere light for natural ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x362d1d, 1.0); // Increased
    this.scene.add(hemisphereLight);
    
    // Spot light for dramatic effect
    const spotLight = new THREE.SpotLight(0xffffff, 2.0);
    spotLight.position.set(0, 50, 30);
    spotLight.target.position.set(0, 0, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.2;
    spotLight.decay = 2;
    spotLight.distance = 100;
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
    
    console.log('Enhanced lighting setup complete');
  }
  
  setupEventListeners() {
    // Mouse movement for parallax effect
    document.addEventListener('mousemove', (event) => {
      this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    // Scroll effect
    window.addEventListener('scroll', () => {
      this.handleScroll();
    });
  }
  
  handleResize() {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  handleScroll() {
    const scrollY = window.pageYOffset;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    
    // Move camera based on scroll but keep model in view
    if (this.camera) {
      // Keep camera in a reasonable range to always see the model
      this.camera.position.z = 15 + scrollProgress * 10; // Closer range
      this.camera.position.y = 5 + scrollProgress * 3;   // Less vertical movement
      this.camera.rotation.z = scrollProgress * 0.02;    // Reduced rotation
      this.camera.lookAt(0, 0, 0); // Always look at model center
    }
    
    // Rotate the wonderful world model based on scroll
    if (this.wonderfulWorldModel && this.modelLoaded) {
      this.wonderfulWorldModel.rotation.x = scrollProgress * Math.PI * 0.1; // Reduced rotation
      this.wonderfulWorldModel.rotation.y += scrollProgress * 0.005;        // Slower rotation
    }
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.005;
    
    // Camera parallax based on mouse - keep camera closer to model
    if (this.camera) {
      const targetX = this.mouseX * 2; // Reduced movement
      const targetY = this.mouseY * 2 + 5; // Keep camera higher
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0); // Always look at scene center where model is
    }
    
    // Animate the wonderful world model
    if (this.wonderfulWorldModel && this.modelLoaded) {
      const userData = this.wonderfulWorldModel.userData;
      if (userData.rotationSpeed) {
        this.wonderfulWorldModel.rotation.x += userData.rotationSpeed.x;
        this.wonderfulWorldModel.rotation.y += userData.rotationSpeed.y;
        this.wonderfulWorldModel.rotation.z += userData.rotationSpeed.z;
      }
      
      // Subtle floating animation - but keep model centered
      const baseY = 0; // Keep at center instead of -2
      this.wonderfulWorldModel.position.y = baseY + Math.sin(this.time * 0.5) * 0.3;
    }
    
    // Animate other meshes (fallback geometry if model fails)
    this.meshes.forEach((mesh) => {
      if (mesh === this.wonderfulWorldModel) return; // Skip model, handled above
      
      const userData = mesh.userData;
      
      // Rotation
      if (userData.rotationSpeed) {
        mesh.rotation.x += userData.rotationSpeed.x;
        mesh.rotation.y += userData.rotationSpeed.y;
        mesh.rotation.z += userData.rotationSpeed.z;
      }
      
      // Floating animation
      if (userData.floatSpeed && userData.originalY !== undefined) {
        mesh.position.y = userData.originalY + Math.sin(this.time * userData.floatSpeed) * 2;
      }
    });
    
    // Animate particles
    this.particles.forEach((particleSystem) => {
      particleSystem.rotation.y += 0.001;
      
      // Subtle pulsing effect
      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(this.time + positions[i] * 0.01) * 0.01;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;
    });
    
    // Render the scene
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  // Methods to sync with voice and other interactions
  syncWithVoice(speaking) {
    if (!this.scene) return;
    
    const intensity = speaking ? 1.8 : 1.0;
    const speed = speaking ? 0.004 : 0.002;
    
    // Update wonderful world model animation based on voice
    if (this.wonderfulWorldModel && this.modelLoaded) {
      const userData = this.wonderfulWorldModel.userData;
      if (userData.rotationSpeed) {
        userData.rotationSpeed.y = speed * intensity;
      }
      
      // Change model lighting when speaking
      this.wonderfulWorldModel.traverse((child) => {
        if (child.isMesh && child.material) {
          if (child.material.emissive) {
            const emissiveIntensity = speaking ? 0.5 : 0.2;
            child.material.emissiveIntensity = emissiveIntensity;
          }
        }
      });
    }
    
    // Update particle animation speed and intensity
    this.particles.forEach((particleSystem) => {
      if (particleSystem.material) {
        particleSystem.material.opacity = speaking ? 1.0 : 0.8;
        particleSystem.userData.rotationSpeed = speed * intensity;
      }
    });
    
    // Update mesh animation (for fallback geometry)
    this.meshes.forEach((mesh) => {
      if (mesh === this.wonderfulWorldModel) return; // Skip model, handled above
      
      if (mesh.userData.rotationSpeed) {
        const baseSpeed = 0.01;
        mesh.userData.rotationSpeed.x = baseSpeed * intensity * (Math.random() + 0.5);
        mesh.userData.rotationSpeed.y = baseSpeed * intensity * (Math.random() + 0.5);
        mesh.userData.rotationSpeed.z = baseSpeed * intensity * (Math.random() + 0.5);
      }
    });
  }
  
  updateColors(hue = 0.5) {
    // Update material colors dynamically
    this.materials.forEach((material) => {
      if (material.color) {
        material.color.setHSL(hue, 0.7, 0.5);
      }
    });
    
    // Update wonderful world model colors
    if (this.wonderfulWorldModel && this.modelLoaded) {
      this.wonderfulWorldModel.traverse((child) => {
        if (child.isMesh && child.material) {
          // Subtle color tinting based on voice selection
          if (child.material.emissive) {
            const color = new THREE.Color();
            color.setHSL(hue, 0.8, 0.1);
            child.material.emissive.copy(color);
          }
        }
      });
    }
  }
  
  dispose() {
    // Cleanup
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Dispose geometries and materials
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
    
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Kyutai TTS Client for Ultra-Low Latency Streaming
class KyutaiTTSClient {
  constructor(serverUrl, config) {
    this.serverUrl = serverUrl || 'wss://your-kyutai-server.com/tts';
    this.websocket = null;
    this.audioContext = null;
    this.audioBuffers = [];
    this.isConnected = false;
    this.isStreaming = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.config = {
      audioFormat: 'pcm',
      sampleRate: 24000,
      bufferSize: 4096,
      maxLatency: 500,
      streamingEnabled: true,
      ...config
    };
    
    this.onConnectionChange = null;
    this.onSpeakingChange = null;
    this.onAudioData = null;
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await this.connect();
    } catch (error) {
      console.log('Kyutai TTS initialization failed, using fallback:', error);
      return false;
    }
    return true;
  }

  async connect() {
    try {
      this.websocket = new WebSocket(this.serverUrl);
      this.websocket.binaryType = 'arraybuffer';
      this.setupEventHandlers();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);

        this.websocket.onopen = () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionChange?.('connected');
          resolve();
        };

        this.websocket.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });
    } catch (error) {
      this.handleConnectionError(error);
      throw error;
    }
  }

  setupEventHandlers() {
    this.websocket.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.handleAudioData(event.data);
      } else {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (e) {
          console.log('Invalid message format');
        }
      }
    };

    this.websocket.onclose = () => {
      this.isConnected = false;
      this.onConnectionChange?.('disconnected');
      this.attemptReconnect();
    };

    this.websocket.onerror = (error) => {
      console.log('WebSocket error:', error);
      this.onConnectionChange?.('error');
    };
  }

  handleAudioData(arrayBuffer) {
    if (!this.audioContext || !arrayBuffer.byteLength) return;

    try {
      // Convert PCM data to AudioBuffer
      this.audioContext.decodeAudioData(arrayBuffer.slice(), (audioBuffer) => {
        this.playAudioBuffer(audioBuffer);
        this.onAudioData?.(audioBuffer);
      }).catch(() => {
        // Handle raw PCM data
        const floatArray = new Float32Array(arrayBuffer);
        const audioBuffer = this.audioContext.createBuffer(1, floatArray.length, this.config.sampleRate);
        audioBuffer.copyToChannel(floatArray, 0);
        this.playAudioBuffer(audioBuffer);
        this.onAudioData?.(audioBuffer);
      });
    } catch (error) {
      console.log('Audio processing error:', error);
    }
  }

  playAudioBuffer(audioBuffer) {
    if (!this.audioContext) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    gainNode.gain.value = 0.7; // Adjust volume
    source.start();
  }

  handleMessage(message) {
    switch (message.type) {
      case 'speaking_start':
        this.isStreaming = true;
        this.onSpeakingChange?.(true);
        break;
      case 'speaking_end':
        this.isStreaming = false;
        this.onSpeakingChange?.(false);
        break;
      case 'error':
        console.log('Kyutai TTS error:', message.error);
        break;
    }
  }

  async speak(text, voice = 'nova', options = {}) {
    if (!this.isConnected || !text.trim()) return false;

    const message = {
      text: text,
      voice: voice,
      streaming: true,
      format: this.config.audioFormat,
      sample_rate: this.config.sampleRate,
      ...options
    };

    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.log('Failed to send message:', error);
      return false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.onConnectionChange?.('reconnecting');
    
    setTimeout(() => {
      this.connect().catch(() => {
        console.log(`Reconnection attempt ${this.reconnectAttempts} failed`);
      });
    }, Math.pow(2, this.reconnectAttempts) * 1000);
  }

  handleConnectionError(error) {
    console.log('Kyutai connection error:', error);
    this.isConnected = false;
    this.onConnectionChange?.('error');
  }

  disconnect() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }
}

// Enhanced Lunai Experience with Refined Logo, Kyutai TTS Integration, and 3D Background
class EnhancedLunaiExperience {
  constructor() {
    this.kyutaiClient = null;
    this.fallbackTTS = null;
    this.audioContext = null;
    this.analyserNode = null;
    this.visualizerData = null;
    this.isAudioInitialized = false;
    
    // 3D Background
    this.threejsBackground = null;
    
    // Voice and audio settings
    this.currentVoice = 'nova';
    this.currentVolume = 0.7;
    this.speechRate = 1.0;
    this.speechPitch = 1.0;
    this.isMuted = false;
    this.isVoicePanelExpanded = false;
    
    // Visual effects
    this.particles = [];
    this.cursorTrails = [];
    this.scrollY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isSpeaking = false;
    
    // Voice content from data
    this.voiceContent = {
      welcome: "Welcome to Lunai, where digital dreams take flight across the cosmic expanse. Behold the Wonderful World that surrounds us as I guide you through this ethereal journey of innovation and elegance.",
      about: "Witness the convergence of technology and cosmic beauty, where every pixel dances with stardust and the Wonderful World comes alive with every interaction.",
      features: "Discover the celestial technologies that power our cosmic vision - each one a star in our constellation of innovation, set against the backdrop of our beautiful world.",
      contact: "Ready to embark on your own cosmic journey through the Wonderful World? The universe of possibilities awaits your command.",
      interactions: {
        hover: "You've discovered a cosmic secret in our wonderful world",
        click: "Initiating stellar connection through the dimensions",
        scroll: "Drifting deeper into the digital nebula of our world"
      }
    };

    this.voices = {
      nova: { name: "Nova", personality: "Serene cosmic guide" },
      stellar: { name: "Stellar", personality: "Bold space pioneer" },
      cosmos: { name: "Cosmos", personality: "Wise universal narrator" },
      eclipse: { name: "Eclipse", personality: "Enigmatic celestial entity" }
    };
    
    this.init();
  }

  async init() {
    // Initialize 3D Background first
    this.init3DBackground();
    
    await this.initAudio();
    this.initKyutaiTTS();
    this.initFallbackTTS();
    this.setupUI();
    this.createStarfield();
    this.createParticles();
    this.initScrollAnimations();
    this.initCarousel();
    this.initFormHandling();
    this.initCursorEffects();
    this.initVoiceControls();
    this.initSoundEffects();
    this.initMobileOptimizations();
    this.initVisualizer();
    this.initRefinedLogo(); // Initialize refined logo without pulsing
    
    // Start the animation loop
    this.animate();
    
    // Auto-connect and show audio panel after short delay
    setTimeout(() => {
      this.showAudioPanel();
      this.startVoiceExperience();
    }, 1500);
  }

  // Initialize 3D Background
  init3DBackground() {
    try {
      this.threejsBackground = new ThreeJSBackground();
      console.log('3D background initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize 3D background:', error);
    }
  }

  // Initialize refined logo with static chrome finish - NO PULSING
  initRefinedLogo() {
    const logoText = document.getElementById('logoText');
    const logoBackdrop = document.getElementById('logoBackdrop');
    
    if (logoText) {
      // Ensure clean, professional appearance
      logoText.style.background = 'linear-gradient(45deg, #E8E8E8, #C0C0C0, #A0A0A0, #C0C0C0)';
      logoText.style.backgroundSize = '300% 100%';
      logoText.style.webkitBackgroundClip = 'text';
      logoText.style.webkitTextFillColor = 'transparent';
      logoText.style.backgroundClip = 'text';
      logoText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255, 255, 0.3)';
      logoText.style.position = 'relative';
      logoText.style.zIndex = '2';
      
      // Remove any existing pulsing animations
      logoText.style.animation = 'none';
      
      // Ensure maximum visibility
      logoText.style.fontFamily = '"Orbitron", monospace';
      logoText.style.fontSize = '3rem';
      logoText.style.fontWeight = '900';
      logoText.style.letterSpacing = '0.5rem';
      logoText.style.textRendering = 'optimizeLegibility';
    }
    
    // Create static backdrop for enhanced contrast
    if (logoBackdrop) {
      logoBackdrop.style.background = 'radial-gradient(ellipse, rgba(0, 0, 0, 0.3) 0%, transparent 70%)';
      logoBackdrop.style.position = 'absolute';
      logoBackdrop.style.top = '50%';
      logoBackdrop.style.left = '50%';
      logoBackdrop.style.transform = 'translate(-50%, -50%)';
      logoBackdrop.style.width = '500px';
      logoBackdrop.style.height = '200px';
      logoBackdrop.style.borderRadius = '50%';
      logoBackdrop.style.zIndex = '1';
      // No animation - static backdrop for professional appearance
    }
    
    console.log('Refined chrome logo initialized - no pulsing effects');
  }

  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createAmbientSounds();
      this.setupAnalyser();
    } catch (error) {
      console.log('Audio context not supported');
    }
  }

  async initKyutaiTTS() {
    const config = {
      audioFormat: 'pcm',
      sampleRate: 24000,
      bufferSize: 4096,
      maxLatency: 500,
      streamingEnabled: true
    };

    this.kyutaiClient = new KyutaiTTSClient('wss://your-kyutai-server.com/tts', config);
    
    // Set up event handlers
    this.kyutaiClient.onConnectionChange = (status) => {
      this.updateConnectionStatus(status);
    };
    
    this.kyutaiClient.onSpeakingChange = (speaking) => {
      this.updateSpeakingState(speaking);
    };
    
    this.kyutaiClient.onAudioData = (audioBuffer) => {
      this.updateAudioVisualization(audioBuffer);
    };

    // Try to initialize Kyutai TTS
    try {
      await this.kyutaiClient.init();
      console.log('Kyutai TTS initialized successfully');
    } catch (error) {
      console.log('Kyutai TTS failed, will use fallback');
      this.updateConnectionStatus('fallback');
    }
  }

  initFallbackTTS() {
    // Web Speech API fallback
    if ('speechSynthesis' in window) {
      this.fallbackTTS = speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = this.fallbackTTS.getVoices();
        console.log('Available voices:', voices.length);
      };
      
      this.fallbackTTS.addEventListener('voiceschanged', loadVoices);
      loadVoices();
    }
  }

  setupUI() {
    this.setupAudioControls();
    this.setupVoiceSelection();
    this.setupConnectionStatus();
  }

  showAudioPanel() {
    const panel = document.getElementById('audioPanel');
    if (panel) {
      panel.style.opacity = '1';
      panel.style.transform = 'translateX(0)';
    }
  }

  setupAudioControls() {
    const toggleBtn = document.getElementById('toggleAudioPanel');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const rateSlider = document.getElementById('rateSlider');
    const pitchSlider = document.getElementById('pitchSlider');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle button clicked');
        this.toggleAudioPanel();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isMuted = !this.isMuted;
        this.updateAudioVolume();
        muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        this.currentVolume = e.target.value / 100;
        this.updateAudioVolume();
      });
    }

    if (rateSlider) {
      rateSlider.addEventListener('input', (e) => {
        this.speechRate = parseFloat(e.target.value);
      });
    }

    if (pitchSlider) {
      pitchSlider.addEventListener('input', (e) => {
        this.speechPitch = parseFloat(e.target.value);
      });
    }
  }

  setupVoiceSelection() {
    const voiceButtons = document.querySelectorAll('.voice-btn');
    voiceButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Voice button clicked:', btn.dataset.voice);
        this.selectVoice(btn.dataset.voice);
        this.updateVoiceUI();
      });
    });
  }

  setupConnectionStatus() {
    this.updateConnectionStatus('disconnected');
  }

  toggleAudioPanel() {
    console.log('Toggling audio panel, current state:', this.isVoicePanelExpanded);
    const panel = document.getElementById('audioPanel');
    const expandedControls = document.getElementById('audioControls');
    
    this.isVoicePanelExpanded = !this.isVoicePanelExpanded;
    
    if (panel && expandedControls) {
      if (this.isVoicePanelExpanded) {
        panel.classList.add('expanded');
        expandedControls.style.maxHeight = '400px';
        expandedControls.style.opacity = '1';
        console.log('Panel expanded');
      } else {
        panel.classList.remove('expanded');
        expandedControls.style.maxHeight = '0';
        expandedControls.style.opacity = '0';
        console.log('Panel collapsed');
      }
    }
  }

  selectVoice(voiceId) {
    console.log('Selecting voice:', voiceId);
    this.currentVoice = voiceId;
    this.updateVoiceUI();
    
    // Update 3D background color based on voice
    if (this.threejsBackground) {
      const voiceColors = {
        nova: 0.6,    // Cyan-blue
        stellar: 0.1, // Orange-red
        cosmos: 0.8,  // Purple
        eclipse: 0.0  // Red
      };
      this.threejsBackground.updateColors(voiceColors[voiceId] || 0.5);
    }
    
    // Test the voice with a short phrase
    this.speak(`Hello, I am ${this.voices[voiceId].name}, your ${this.voices[voiceId].personality.toLowerCase()}.`);
  }

  updateVoiceUI() {
    const voiceButtons = document.querySelectorAll('.voice-btn');
    voiceButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.voice === this.currentVoice);
    });
    console.log('Voice UI updated for:', this.currentVoice);
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement?.querySelector('.status-dot');
    const statusText = statusElement?.querySelector('.status-text');
    
    if (!statusElement) return;

    statusDot.className = `status-dot ${status}`;
    
    const statusMessages = {
      connected: 'Connected to Kyutai TTS',
      connecting: 'Connecting to Kyutai...',
      reconnecting: 'Reconnecting...',
      disconnected: 'Disconnected',
      error: 'Connection Error',
      fallback: 'Using Web Speech API'
    };
    
    statusText.textContent = statusMessages[status] || 'Unknown Status';
    console.log('Connection status updated:', status);
  }

  updateSpeakingState(speaking) {
    console.log('Speaking state changed:', speaking);
    this.isSpeaking = speaking;
    const indicator = document.getElementById('speakingIndicator');
    const visualizer = document.getElementById('audioVisualizer');
    
    if (speaking) {
      indicator?.classList.add('active');
      visualizer?.classList.add('active');
      this.syncVisualElements(true);
    } else {
      indicator?.classList.remove('active');
      visualizer?.classList.remove('active');
      this.syncVisualElements(false);
    }
  }

  // Updated visual sync - only voice-reactive effects, NO PULSING + 3D Background sync
  syncVisualElements(speaking) {
    const logo = document.querySelector('.logo-text');
    const crescents = document.querySelectorAll('.crescent');
    
    if (speaking) {
      // Only apply voice-reactive effects during speech
      logo?.classList.add('speaking');
      crescents.forEach(c => c.classList.add('voice-reactive'));
      
      // Sync 3D background with voice
      if (this.threejsBackground) {
        this.threejsBackground.syncWithVoice(true);
      }
    } else {
      // Return to static, professional appearance
      logo?.classList.remove('speaking');
      crescents.forEach(c => c.classList.remove('voice-reactive'));
      
      // Return 3D background to normal state
      if (this.threejsBackground) {
        this.threejsBackground.syncWithVoice(false);
      }
    }
    
    // NO logo glow pulsing - maintain static professional look
  }

  async speak(text, voice = this.currentVoice) {
    if (!text || this.isMuted) return false;

    console.log('Speaking:', text, 'with voice:', voice);

    // Try Kyutai first
    if (this.kyutaiClient?.isConnected) {
      const success = await this.kyutaiClient.speak(text, voice, {
        rate: this.speechRate,
        pitch: this.speechPitch,
        volume: this.currentVolume
      });
      
      if (success) {
        return true;
      }
    }

    // Fallback to Web Speech API
    return this.speakWithFallback(text, voice);
  }

  speakWithFallback(text, voice) {
    if (!this.fallbackTTS) return false;

    console.log('Using fallback TTS for:', text);

    // Cancel any ongoing speech
    this.fallbackTTS.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;
    utterance.volume = this.isMuted ? 0 : this.currentVolume;

    // Try to find a suitable voice
    const voices = this.fallbackTTS.getVoices();
    let selectedVoice = null;

    // Voice mapping for fallback
    const voicePreferences = {
      nova: ['female', 'woman', 'aria', 'zira', 'samantha'],
      stellar: ['female', 'woman', 'hazel', 'susan'],
      cosmos: ['male', 'man', 'david', 'daniel', 'alex'],
      eclipse: ['female', 'male', 'whisper', 'soft']
    };

    const preferences = voicePreferences[voice] || [];
    
    for (const pref of preferences) {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes(pref) || 
        v.gender?.toLowerCase() === pref
      );
      if (selectedVoice) break;
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      console.log('Speech started');
      this.updateSpeakingState(true);
    };
    
    utterance.onend = () => {
      console.log('Speech ended');
      this.updateSpeakingState(false);
    };
    
    utterance.onerror = (e) => {
      console.log('Speech error:', e);
      this.updateSpeakingState(false);
    };

    this.fallbackTTS.speak(utterance);
    return true;
  }

  setupAnalyser() {
    if (!this.audioContext) return;

    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.visualizerData = new Uint8Array(this.analyserNode.frequencyBinCount);
  }

  initVisualizer() {
    const canvas = document.getElementById('visualizerCanvas');
    if (!canvas) {
      console.log('Visualizer canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    let animationFrame;

    const draw = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (this.isSpeaking) {
        if (this.analyserNode && this.visualizerData) {
          this.analyserNode.getByteFrequencyData(this.visualizerData);
        } else {
          // Simulate data for fallback TTS
          for (let i = 0; i < 128; i++) {
            this.visualizerData[i] = Math.random() * 128 + 64;
          }
        }

        const barWidth = (canvas.offsetWidth / 64);
        let barHeight;
        let x = 0;

        for (let i = 0; i < 64; i++) {
          const dataIndex = Math.floor(i * (this.visualizerData.length / 64));
          barHeight = (this.visualizerData[dataIndex] / 255) * canvas.offsetHeight * 0.8;
          
          const hue = (i / 64) * 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
          ctx.fillRect(x, canvas.offsetHeight - barHeight, barWidth - 1, barHeight);
          
          x += barWidth;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    console.log('Visualizer initialized');
  }

  updateAudioVisualization(audioBuffer) {
    if (!this.analyserNode || !audioBuffer) return;

    // Connect audio buffer to analyser
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);
  }

  async startVoiceExperience() {
    // Initialize audio context on user interaction
    const initAudio = async () => {
      if (this.audioContext?.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isAudioInitialized = true;
      console.log('Audio initialized');
      
      // Update connection status to show fallback is ready
      this.updateConnectionStatus('fallback');
    };

    // Auto-start or wait for user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    // Try to start automatically (some browsers allow this)
    try {
      await initAudio();
    } catch (error) {
      console.log('Waiting for user interaction to start audio');
    }
  }

  initVoiceControls() {
    const welcomeBtn = document.getElementById('voiceWelcome');
    if (welcomeBtn) {
      welcomeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Welcome button clicked');
        
        if (!this.isAudioInitialized) {
          await this.startVoiceExperience();
        }
        
        await this.speak(this.voiceContent.welcome);
      });
    }

    // Section-based narration
    this.setupNarrationTriggers();
    
    // Interactive element narration
    this.setupInteractiveNarration();
  }

  setupNarrationTriggers() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.dataset.narrate) {
          const content = this.voiceContent[entry.target.dataset.narrate];
          if (content && this.isAudioInitialized) {
            // Delay to allow smooth scrolling
            setTimeout(() => {
              this.speak(content);
            }, 800);
          }
        }
      });
    }, { threshold: 0.5, rootMargin: '-100px' });

    document.querySelectorAll('[data-narrate]').forEach(el => {
      observer.observe(el);
    });
  }

  setupInteractiveNarration() {
    // Card hover narration
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (this.isAudioInitialized) {
          const narrationKey = card.dataset.narrate;
          if (narrationKey) {
            setTimeout(() => {
              this.speak(this.voiceContent.interactions.hover);
            }, 300);
          }
        }
      });
    });

    // Button click narration
    document.querySelectorAll('[data-narrate="true"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.isAudioInitialized) {
          this.speak(this.voiceContent.interactions.click);
        }
      });
    });

    // Form field focus assistance
    document.querySelectorAll('[data-speak-on-focus="true"]').forEach(input => {
      input.addEventListener('focus', (e) => {
        if (this.isAudioInitialized) {
          const label = e.target.previousElementSibling?.textContent || 
                       e.target.getAttribute('placeholder') ||
                       'Input field focused';
          this.speak(`${label} field selected`);
          
          // Visual feedback
          e.target.classList.add('speaking-focus');
          setTimeout(() => {
            e.target.classList.remove('speaking-focus');
          }, 2000);
        }
      });
    });
  }

  // Enhanced visual effects
  createAmbientSounds() {
    if (!this.audioContext) return;

    const createOscillator = (frequency, type = 'sine') => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      return { oscillator, gainNode };
    };

    // Cosmic ambient sounds
    const cosmicHum = createOscillator(40, 'sine');
    cosmicHum.oscillator.start();
    
    const stellarWind = createOscillator(120, 'triangle');
    stellarWind.gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
    stellarWind.oscillator.start();
  }

  updateAudioVolume() {
    const volume = this.isMuted ? 0 : this.currentVolume;
    
    // Update ambient sounds if they exist
    if (this.audioContext) {
      this.audioContext.destination.volume = volume;
    }
  }

  createStarfield() {
    const starfield = document.getElementById('starfield');
    if (!starfield) return;

    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.cssText = `
        position: absolute;
        width: ${Math.random() * 3 + 1}px;
        height: ${Math.random() * 3 + 1}px;
        background: ${Math.random() > 0.7 ? '#00ffff' : '#ffffff'};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.8 + 0.2};
        animation: starTwinkle ${Math.random() * 4 + 2}s infinite;
      `;
      starfield.appendChild(star);
    }
  }

  createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    setInterval(() => {
      if (this.particles.length < 20) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        container.appendChild(particle);
        this.particles.push(particle);

        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
            this.particles = this.particles.filter(p => p !== particle);
          }
        }, 8000);
      }
    }, 500);
  }

  initScrollAnimations() {
    window.addEventListener('scroll', () => {
      this.scrollY = window.pageYOffset;
      this.updateParallax();
      this.updateLogoFloat();
      this.checkAnimationTriggers();
    });
  }

  updateParallax() {
    const starfield = document.getElementById('starfield');
    if (starfield) {
      starfield.style.transform = `translateY(${this.scrollY * 0.5}px)`;
    }
  }

  updateLogoFloat() {
    const logo = document.getElementById('logo3d');
    if (logo) {
      const progress = Math.min(this.scrollY / window.innerHeight, 1);
      const opacity = 1 - progress;
      const translateY = -this.scrollY * 0.3;
      const rotateY = progress * 180;
      
      logo.style.transform = `translateY(${translateY}px) rotateY(${rotateY}deg)`;
      logo.style.opacity = opacity;
    }
  }

  checkAnimationTriggers() {
    const elements = document.querySelectorAll('[data-aos]');
    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.8;
      
      if (rect.top < triggerPoint && !element.classList.contains('animate')) {
        const delay = element.dataset.delay || 0;
        setTimeout(() => {
          element.classList.add('animate');
          this.playSound('ping', 800, 0.2);
        }, parseInt(delay));
      }
    });
  }

  initCarousel() {
    const carousel = document.getElementById('featureCarousel');
    const navDots = document.querySelectorAll('.nav-dot');
    let currentSlide = 0;
    
    const updateCarousel = (index) => {
      const items = carousel?.querySelectorAll('.carousel-item');
      if (!items) return;

      items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });

      navDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      currentSlide = index;
      this.playSound('whoosh', 400, 0.3);
    };

    navDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        updateCarousel(index);
      });
    });

    setInterval(() => {
      const nextSlide = (currentSlide + 1) % navDots.length;
      updateCarousel(nextSlide);
    }, 5000);
  }

  initFormHandling() {
    const form = document.getElementById('contactForm');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });
  }

  handleFormSubmission() {
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    const burst = submitBtn.querySelector('.btn-burst');
    if (burst) {
      burst.style.width = '300px';
      burst.style.height = '300px';
      burst.style.opacity = '1';
      
      setTimeout(() => {
        burst.style.width = '0';
        burst.style.height = '0';
        burst.style.opacity = '0';
      }, 600);
    }

    this.playSound('success', 800, 0.5);
    this.speak("Message launched successfully! Your cosmic journey begins now.");

    submitBtn.innerHTML = '<span>Message Launched! 🚀</span>';
    submitBtn.style.background = 'linear-gradient(45deg, #00ff88, #00cc66)';

    setTimeout(() => {
      submitBtn.innerHTML = '<span>Launch Into Tomorrow</span>';
      submitBtn.style.background = 'linear-gradient(45deg, var(--cyan-glow), rgba(0, 255, 255, 0.8))';
    }, 3000);
  }

  initCursorEffects() {
    let trails = [];
    const maxTrails = 10;

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
      document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');

      if (trails.length >= maxTrails) {
        const oldTrail = trails.shift();
        if (oldTrail && oldTrail.parentNode) {
          oldTrail.parentNode.removeChild(oldTrail);
        }
      }

      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.left = e.clientX + 'px';
      trail.style.top = e.clientY + 'px';
      trail.style.opacity = '1';

      document.body.appendChild(trail);
      trails.push(trail);

      setTimeout(() => {
        trail.style.opacity = '0';
        setTimeout(() => {
          if (trail.parentNode) {
            trail.parentNode.removeChild(trail);
          }
        }, 300);
      }, 50);
    });
  }

  initSoundEffects() {
    const buttons = document.querySelectorAll('button, .btn, .cta-btn');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        this.playSound('hover', 800, 0.1);
      });

      button.addEventListener('click', () => {
        this.playSound('click', 400, 0.2);
      });
    });

    const cards = document.querySelectorAll('.feature-card, .feature-3d-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        this.playSound('ping', 600, 0.15);
      });
    });
  }

  playSound(type, frequency = 440, duration = 0.1) {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.currentVolume * 0.1, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  initMobileOptimizations() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      this.particles = this.particles.slice(0, 10);
      document.body.classList.add('mobile-optimized');
      
      let touchStartY = 0;
      document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
      });

      document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        
        if (Math.abs(deltaY) > 50) {
          this.playSound('swipe', 300, 0.1);
          touchStartY = touchY;
        }
      });
    }
  }

  // Refined animation loop - NO LOGO PULSING
  animate() {
    const time = Date.now() * 0.001;
    
    // Keep subtle floating animation (not pulsing)
    const logoText = document.querySelector('.logo-text');
    if (logoText && this.scrollY < window.innerHeight) {
      // Only gentle floating motion - NO pulsing or scaling
      const baseTransform = `rotateX(${Math.sin(time * 0.5) * 2}deg) rotateY(${Math.cos(time * 0.3) * 1}deg)`;
      logoText.style.transform = baseTransform;
    }

    // Keep crescent rotations (separate from logo)
    const leftCrescent = document.querySelector('.left-crescent');
    const rightCrescent = document.querySelector('.right-crescent');
    
    if (leftCrescent) {
      leftCrescent.style.transform = `rotate(${time * 20}deg)`;
    }
    if (rightCrescent) {
      rightCrescent.style.transform = `rotate(${-time * 20}deg)`;
    }

    // NO logo glow pulsing - maintain static professional appearance

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize the enhanced experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Enhanced Lunai Experience with refined logo');
  new EnhancedLunaiExperience();
});

// Additional interaction handlers
document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      });
    });
  }

  // Dynamic background effects based on voice activity
  window.addEventListener('scroll', () => {
    const scrollPercent = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
    const hue = Math.floor(scrollPercent * 60);
    document.documentElement.style.setProperty('--dynamic-hue', hue);
  });
});

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    if (loadTime > 3000) {
      document.body.classList.add('slow-device');
    }
  });
}

// Error handling
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('audio')) {
    console.log('Audio functionality may be limited due to browser restrictions');
  }
});

// CSS Animations for voice-reactive effects (no logo pulsing)
const voiceReactiveStyles = document.createElement('style');
voiceReactiveStyles.textContent = `
  @keyframes voiceReactiveGlow {
    0%, 100% { 
      box-shadow: 0 0 20px var(--speaking-pulse);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 40px var(--speaking-pulse), 0 0 60px var(--speaking-pulse);
      transform: scale(1.05);
    }
  }

  .feature-card.speaking {
    animation: voiceReactiveGlow 2s ease-in-out infinite;
  }

  .mobile-optimized .starfield::before,
  .mobile-optimized .starfield::after {
    animation-duration: 60s;
  }

  .slow-device * {
    animation-duration: 2s !important;
    transition-duration: 0.5s !important;
  }

  body::after {
    left: var(--mouse-x, 0);
    top: var(--mouse-y, 0);
  }
`;

document.head.appendChild(voiceReactiveStyles);