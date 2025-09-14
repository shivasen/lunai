// Lunai 3D Landing Page - Final Optimized Version with All Requirements
// FIXED: Contact form dropdown functionality

// SETUP INSTRUCTIONS FOR EMAILJS:
// 
// 1. Create account at https://www.emailjs.com/
// 2. Add email service (Gmail, Outlook, etc.)
// 3. Create email template with these variables:
//    - {{from_name}} - Sender's name
//    - {{reply_to}} - Sender's email  
//    - {{interest_area}} - Selected interest area
//    - {{message}} - Message content
//    - {{to_email}} - Your receiving email
// 4. Get your Public Key, Service ID, and Template ID
// 5. Replace the placeholder values in EMAIL_CONFIG below:

const EMAIL_CONFIG = {
    publicKey: 'YOUR_PUBLIC_KEY_HERE',     // Replace with your EmailJS public key
    serviceId: 'YOUR_SERVICE_ID_HERE',     // Replace with your EmailJS service ID
    templateId: 'YOUR_TEMPLATE_ID_HERE'    // Replace with your EmailJS template ID
};

// EmailJS Manager Class for Professional Email Handling
class EmailManager {
    constructor() {
        this.config = EMAIL_CONFIG;
        this.isInitialized = false;
        this.rateLimitCount = 0;
        this.rateLimitWindow = 60000; // 1 minute
        this.maxEmailsPerWindow = 3;
    }

    async initialize() {
        if (typeof emailjs !== 'undefined' && this.config.publicKey !== 'YOUR_PUBLIC_KEY_HERE') {
            try {
                emailjs.init({ publicKey: this.config.publicKey });
                this.isInitialized = true;
                console.log('EmailJS initialized successfully');
                return true;
            } catch (error) {
                console.error('EmailJS initialization failed:', error);
                return false;
            }
        }
        console.warn('EmailJS not configured. Please update EMAIL_CONFIG with your credentials.');
        return false;
    }

    validateForm(formData) {
        const errors = [];
        
        if (!formData.from_name || formData.from_name.trim().length < 2) {
            errors.push('Name must be at least 2 characters');
        }
        
        if (!formData.reply_to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.reply_to)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!formData.interest_area) {
            errors.push('Please select your area of interest');
        }
        
        if (!formData.message || formData.message.trim().length < 10) {
            errors.push('Message must be at least 10 characters long');
        }

        // Check honeypot for spam
        if (formData.honeypot && formData.honeypot.trim() !== '') {
            errors.push('Spam detected');
        }
        
        return errors;
    }

    checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this.rateLimitWindow;
        
        // Reset counter if window has passed
        if (this.lastReset < windowStart) {
            this.rateLimitCount = 0;
            this.lastReset = now;
        }
        
        if (this.rateLimitCount >= this.maxEmailsPerWindow) {
            return false;
        }
        
        return true;
    }

    async sendEmail(formData) {
        if (!this.isInitialized) {
            throw new Error('EmailJS not initialized. Please configure your credentials.');
        }

        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please wait before sending another message.');
        }

        // Validate form data
        const errors = this.validateForm(formData);
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }

        // Prepare email data
        const emailData = {
            from_name: formData.from_name.trim(),
            reply_to: formData.reply_to.trim().toLowerCase(),
            interest_area: formData.interest_area,
            message: formData.message.trim(),
            to_email: formData.to_email || 'your-email@domain.com',
            sent_at: new Date().toLocaleString(),
            user_agent: navigator.userAgent
        };

        try {
            const response = await emailjs.send(
                this.config.serviceId,
                this.config.templateId,
                emailData
            );
            
            this.rateLimitCount++;
            console.log('Email sent successfully:', response);
            return response;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
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

// Enhanced Lunai Experience with All Final Requirements
class EnhancedLunaiExperience {
  constructor() {
    this.kyutaiClient = null;
    this.fallbackTTS = null;
    this.audioContext = null;
    this.analyserNode = null;
    this.visualizerData = null;
    this.isAudioInitialized = false;
    this.emailManager = new EmailManager();
    
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
    
    // Services section state
    this.expandedService = null;
    this.servicesSectionAnimated = false;
    this.raLunaiAnimated = false;
    
    // Updated voice content with Ra Lunai AI and South Indian testimonials
    this.voiceContent = {
      welcome: "Welcome to Lunai, where digital dreams take flight across the cosmic expanse. Experience the eclipse of tomorrow with our revolutionary Ra Lunai AI system.",
      services: "Discover our comprehensive cosmic services, designed to elevate your brand and vision across all digital dimensions. From strategic branding to political campaigns, we illuminate every path.",
      about: "Behold the convergence of technology and cosmic beauty, where every pixel dances with stardust and every interaction echoes through the digital cosmos.",
      features: "Witness the birth of Ra Lunai AI - our revolutionary artificial intelligence system coming soon to transform your digital universe with cosmic precision.",
      contact: "Ready to embark on your own cosmic journey? The universe of possibilities awaits your command. Let us guide you through the eclipse of innovation.",
      raLunai: "Ra Lunai AI - the next evolution in cosmic intelligence - coming soon to transform your digital universe with unprecedented power and elegance.",
      email: {
        loading: "Transmitting your message across digital dimensions...",
        success: "Your message has been successfully launched into the cosmic network. We'll respond within 24 hours.",
        error: "Cosmic communication interrupted. Please check your details and try again.",
        validation: "Please complete all required fields to launch your cosmic message."
      },
      interactions: {
        hover: "You've discovered a cosmic secret",
        click: "Initiating stellar connection",
        scroll: "Drifting deeper into the digital nebula"
      },
      serviceCategories: {
        branding: "Strategic Branding Excellence - crafting stellar identities that shine across the cosmos",
        research: "Strategic Research and Intelligence - deep cosmic insights to illuminate your path",
        strategy: "Comprehensive Strategy Development - navigating the infinite possibilities of innovation",
        political: "Political Campaign Excellence - stellar campaigns that resonate across all demographics",
        digital: "Digital Web Excellence - cosmic experiences that transcend digital boundaries",
        content: "Content and Creative Excellence - illuminating content across all cosmic mediums"
      },
      testimonials: {
        priya: "Dr. Priya Krishnamurthy from Chennai praises our innovative voice synthesis and cosmic design philosophy",
        rajesh: "Rajesh Nair from Bangalore celebrates our AI voice technology and strategic branding excellence",
        kavitha: "Kavitha Reddy from Hyderabad highlights our transformative digital excellence and visionary approach"
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
    await this.initAudio();
    await this.initEmailJS();
    this.initKyutaiTTS();
    this.initFallbackTTS();
    this.setupUI();
    this.createStarfield();
    this.createParticles();
    this.initScrollAnimations();
    this.initEnhancedFormHandling();
    this.initCursorEffects();
    this.initVoiceControls();
    this.initSoundEffects();
    this.initMobileOptimizations();
    this.initVisualizer();
    this.initRefinedLogo();
    this.initServicesSection();
    this.initRaLunaiFeature();
    this.initTestimonials();
    this.initResponsiveOptimizations();
    
    // Start the animation loop
    this.animate();
    
    // Auto-connect and show audio panel after short delay
    setTimeout(() => {
      this.showAudioPanel();
      this.startVoiceExperience();
    }, 1500);
  }

  // Initialize responsive optimizations
  initResponsiveOptimizations() {
    // Detect device type
    this.deviceType = this.getDeviceType();
    document.body.classList.add(`device-${this.deviceType}`);
    
    // Handle orientation changes on mobile
    if (this.deviceType === 'mobile') {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.handleOrientationChange();
        }, 500);
      });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
    
    console.log(`Initialized for ${this.deviceType} device`);
  }

  getDeviceType() {
    const width = window.innerWidth;
    if (width >= 1200) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  handleOrientationChange() {
    // Recalculate layout for mobile orientation changes
    this.deviceType = this.getDeviceType();
    document.body.className = document.body.className.replace(/device-\w+/, `device-${this.deviceType}`);
    
    // Adjust particle count for performance
    if (this.deviceType === 'mobile') {
      this.particles = this.particles.slice(0, 10);
    }
  }

  handleResize() {
    const newDeviceType = this.getDeviceType();
    if (newDeviceType !== this.deviceType) {
      this.deviceType = newDeviceType;
      document.body.className = document.body.className.replace(/device-\w+/, `device-${this.deviceType}`);
      
      // Adjust effects based on device type
      this.adjustEffectsForDevice();
    }
  }

  adjustEffectsForDevice() {
    switch (this.deviceType) {
      case 'mobile':
        this.particles = this.particles.slice(0, 10);
        break;
      case 'tablet':
        this.particles = this.particles.slice(0, 15);
        break;
      case 'desktop':
        // Full effects for desktop
        break;
    }
  }

  // Initialize Ra Lunai AI feature
  initRaLunaiFeature() {
    const raLunaiFeature = document.querySelector('.ra-lunai-feature');
    if (!raLunaiFeature) return;

    // Setup intersection observer for Ra Lunai AI
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.raLunaiAnimated) {
          this.raLunaiAnimated = true;
          
          // Animate Ra Lunai AI feature
          raLunaiFeature.classList.add('animate');
          
          // Voice narration for Ra Lunai AI
          if (this.isAudioInitialized) {
            setTimeout(() => {
              this.speak(this.voiceContent.raLunai);
            }, 1000);
          }
          
          // Special effects for Ra Lunai AI
          this.createRaLunaiEffects(raLunaiFeature);
        }
      });
    }, { 
      threshold: 0.5,
      rootMargin: '-100px'
    });

    observer.observe(raLunaiFeature);

    // Add hover effects
    raLunaiFeature.addEventListener('mouseenter', () => {
      if (this.isAudioInitialized) {
        setTimeout(() => {
          this.speak("Ra Lunai AI represents the future of cosmic intelligence - revolutionary technology arriving soon");
        }, 300);
      }
      this.createCosmicRipple(raLunaiFeature);
    });
  }

  createRaLunaiEffects(element) {
    // Create special cosmic effects for Ra Lunai AI
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: 6px;
        height: 6px;
        background: linear-gradient(45deg, #00ffff, #00ff88);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      `;
      
      element.appendChild(particle);
      
      const angle = (i / 12) * Math.PI * 2;
      const distance = 150 + Math.random() * 100;
      const duration = 2000 + Math.random() * 1000;
      
      particle.animate([
        { 
          transform: 'translate(-50%, -50%) scale(0)',
          opacity: 1 
        },
        { 
          transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance - 50}%) scale(1)`,
          opacity: 0 
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }

    this.playSound('cosmic', 600, 0.4);
  }

  createCosmicRipple(element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    ripple.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      background: radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      left: ${rect.left + rect.width / 2 - 20}px;
      top: ${rect.top + rect.height / 2 - 20}px;
      transform: scale(0);
    `;
    
    document.body.appendChild(ripple);
    
    ripple.animate([
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(5)', opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-out'
    }).addEventListener('finish', () => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    });
  }

  // Initialize testimonials with South Indian professionals
  initTestimonials() {
    const testimonialStars = document.querySelectorAll('.testimonial-star');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('animate');
            this.playSound('ping', 800 + index * 200, 0.3);
          }, index * 300);
        }
      });
    }, { 
      threshold: 0.3,
      rootMargin: '-50px'
    });

    testimonialStars.forEach(star => {
      observer.observe(star);
      
      // Add hover effects with voice narration
      star.addEventListener('mouseenter', () => {
        if (this.isAudioInitialized) {
          const cite = star.querySelector('cite').textContent;
          let voiceKey = 'priya';
          if (cite.includes('Rajesh')) voiceKey = 'rajesh';
          if (cite.includes('Kavitha')) voiceKey = 'kavitha';
          
          setTimeout(() => {
            this.speak(this.voiceContent.testimonials[voiceKey]);
          }, 300);
        }
        
        this.createStarBurst(star);
      });
    });
  }

  createStarBurst(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
      const star = document.createElement('div');
      star.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #00ffff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        box-shadow: 0 0 10px #00ffff;
      `;
      
      document.body.appendChild(star);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const duration = 1200 + Math.random() * 400;
      
      star.animate([
        { 
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1 
        },
        { 
          transform: `translate(${Math.cos(angle) * distance - 50}%, ${Math.sin(angle) * distance - 50}%) scale(0)`,
          opacity: 0 
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      });
    }
  }

  // Initialize EmailJS
  async initEmailJS() {
    const success = await this.emailManager.initialize();
    if (success) {
      console.log('Email system ready for cosmic transmissions');
    } else {
      console.log('Email system using demo mode - configure EmailJS for full functionality');
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
      logoBackdrop.style.borderRadius = '50%';
      logoBackdrop.style.zIndex = '1';
      // No animation - static backdrop for professional appearance
    }
    
    console.log('Refined chrome logo initialized - no pulsing effects');
  }

  // Initialize Services Section functionality
  initServicesSection() {
    console.log('Initializing services section...');
    
    // Setup service card interactions
    this.setupServiceCards();
    
    // Setup intersection observer for services section
    this.setupServicesObserver();
    
    console.log('Services section initialized');
  }

  setupServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
      const expandBtn = card.querySelector('.service-expand-btn');
      const serviceType = card.dataset.service;
      
      // Hover effects with voice narration
      card.addEventListener('mouseenter', () => {
        if (this.isAudioInitialized && this.voiceContent.serviceCategories[serviceType]) {
          // Delay for smooth interaction
          setTimeout(() => {
            this.speak(this.voiceContent.serviceCategories[serviceType]);
          }, 300);
        }
        
        // Visual hover effects
        this.createParticleEffect(card);
        this.playSound('hover', 600, 0.15);
      });

      // Click to expand/collapse services
      if (expandBtn) {
        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleServiceCard(card, serviceType);
        });
      }

      // Card click to expand
      card.addEventListener('click', (e) => {
        if (e.target.closest('.service-list') || e.target.closest('.service-expand-btn')) {
          return;
        }
        this.toggleServiceCard(card, serviceType);
      });
    });
  }

  toggleServiceCard(card, serviceType) {
    const isCurrentlyExpanded = card.classList.contains('expanded');
    const expandBtn = card.querySelector('.service-expand-btn span');
    const serviceList = card.querySelector('.service-list');
    
    if (isCurrentlyExpanded) {
      // Collapse current card
      card.classList.remove('expanded');
      this.expandedService = null;
      
      if (expandBtn) {
        expandBtn.textContent = 'Explore Services';
      }
      
      // Animate collapse
      if (serviceList) {
        serviceList.style.maxHeight = '0';
        serviceList.style.opacity = '0';
      }
      
      this.speak("Service details collapsed");
      
      // Reset card position and size
      setTimeout(() => {
        card.style.gridColumn = '';
        card.style.maxWidth = '';
        card.style.margin = '';
      }, 300);
      
    } else {
      // Close any other expanded card first
      if (this.expandedService && this.expandedService !== card) {
        this.expandedService.classList.remove('expanded');
        const prevExpandBtn = this.expandedService.querySelector('.service-expand-btn span');
        const prevServiceList = this.expandedService.querySelector('.service-list');
        
        if (prevExpandBtn) {
          prevExpandBtn.textContent = 'Explore Services';
        }
        if (prevServiceList) {
          prevServiceList.style.maxHeight = '0';
          prevServiceList.style.opacity = '0';
        }
        
        // Reset previous card layout
        this.expandedService.style.gridColumn = '';
        this.expandedService.style.maxWidth = '';
        this.expandedService.style.margin = '';
      }
      
      // Expand current card
      card.classList.add('expanded');
      this.expandedService = card;
      
      if (expandBtn) {
        expandBtn.textContent = 'Collapse Services';
      }
      
      // Animate expansion
      if (serviceList) {
        serviceList.style.maxHeight = '400px';
        serviceList.style.opacity = '1';
      }
      
      // Voice narration for expanded services
      const serviceTitle = card.querySelector('.service-title').textContent;
      this.speak(`Exploring ${serviceTitle} - transforming visions into cosmic reality`);
      
      // Scroll expanded card into view with delay
      setTimeout(() => {
        card.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 400);
    }
    
    // Play sound effect
    this.playSound('click', isCurrentlyExpanded ? 300 : 500, 0.3);
    
    // Create visual effects
    this.createExpandEffect(card);
  }

  createParticleEffect(element) {
    const rect = element.getBoundingClientRect();
    const particles = [];
    
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #00ffff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
        opacity: 1;
      `;
      
      document.body.appendChild(particle);
      particles.push(particle);
      
      // Animate particle
      const angle = (i / 8) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      const duration = 800 + Math.random() * 400;
      
      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1 
        },
        { 
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
          opacity: 0 
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }
  }

  createExpandEffect(element) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    ripple.style.cssText = `
      position: fixed;
      width: 20px;
      height: 20px;
      background: radial-gradient(circle, rgba(0, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      left: ${rect.left + rect.width / 2 - 10}px;
      top: ${rect.top + rect.height / 2 - 10}px;
      transform: scale(0);
    `;
    
    document.body.appendChild(ripple);
    
    ripple.animate([
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(3)', opacity: 0 }
    ], {
      duration: 600,
      easing: 'ease-out'
    }).addEventListener('finish', () => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    });
  }

  setupServicesObserver() {
    const servicesSection = document.getElementById('services');
    if (!servicesSection) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.servicesSectionAnimated) {
          this.servicesSectionAnimated = true;
          
          // Animate service cards
          this.animateServiceCards();
          
          // Voice narration for services section
          if (this.isAudioInitialized) {
            setTimeout(() => {
              this.speak(this.voiceContent.services);
            }, 800);
          }
        }
      });
    }, { 
      threshold: 0.3,
      rootMargin: '-100px'
    });

    observer.observe(servicesSection);
  }

  animateServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
      const delay = parseInt(card.dataset.delay) || index * 200;
      
      setTimeout(() => {
        card.classList.add('animate');
        this.playSound('ping', 800 + index * 100, 0.2);
      }, delay);
    });
  }

  // FIXED: Enhanced Form Handling with proper dropdown functionality
  initEnhancedFormHandling() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // FIXED: Properly handle dropdown functionality
    const dropdown = document.getElementById('contactInterest');
    if (dropdown) {
      // Ensure dropdown is fully functional
      dropdown.style.pointerEvents = 'auto';
      dropdown.style.position = 'relative';
      dropdown.style.zIndex = '1000';
      
      // Remove any potential blocking elements
      dropdown.style.webkitAppearance = 'menulist';
      dropdown.style.mozAppearance = 'menulist';
      dropdown.style.appearance = 'menulist';
      
      // Force cursor to show it's clickable
      dropdown.style.cursor = 'pointer';
      
      // Clear any CSS that might interfere
      dropdown.style.userSelect = 'auto';
      dropdown.style.webkitUserSelect = 'auto';
      dropdown.style.mozUserSelect = 'auto';
      
      // Add explicit event listeners
      dropdown.addEventListener('mousedown', (e) => {
        console.log('Dropdown mousedown event triggered');
        e.stopPropagation();
      });
      
      dropdown.addEventListener('click', (e) => {
        console.log('Dropdown click event triggered');
        e.stopPropagation();
        // Force focus to ensure dropdown opens
        dropdown.focus();
      });

      dropdown.addEventListener('change', (e) => {
        console.log('Dropdown changed to:', e.target.value);
        this.clearFieldError(e.target);
        
        // Voice feedback for selection
        if (this.isAudioInitialized && e.target.value) {
          const selectedText = e.target.options[e.target.selectedIndex].text;
          this.speak(`Selected ${selectedText}`);
        }
      });

      dropdown.addEventListener('focus', () => {
        console.log('Dropdown focused');
        this.clearFieldError(dropdown);
        // Add visual feedback when focused
        dropdown.style.borderColor = '#00ffff';
        dropdown.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
      });

      dropdown.addEventListener('blur', () => {
        console.log('Dropdown blurred');
        // Reset border when not focused (unless there's an error)
        if (!dropdown.classList.contains('error')) {
          dropdown.style.borderColor = '';
          dropdown.style.boxShadow = '';
        }
      });

      // Test dropdown functionality
      console.log('Dropdown setup completed. Available options:', dropdown.options.length);
      for (let i = 0; i < dropdown.options.length; i++) {
        console.log(`Option ${i}: ${dropdown.options[i].value} - ${dropdown.options[i].text}`);
      }
    } else {
      console.error('Contact interest dropdown not found!');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleEnhancedFormSubmission(form);
    });

    // Real-time validation
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      let hasBeenTouched = false;
      
      input.addEventListener('focus', () => {
        this.clearFieldError(input);
      });

      input.addEventListener('blur', () => {
        hasBeenTouched = true;
        if (input.value.trim() || input.tagName === 'SELECT') {
          this.validateField(input);
        }
      });

      input.addEventListener('input', () => {
        this.clearFieldError(input);
        if (hasBeenTouched && input.value.trim()) {
          setTimeout(() => this.validateField(input), 500);
        }
      });

      input.addEventListener('change', () => {
        hasBeenTouched = true;
        this.clearFieldError(input);
        this.validateField(input);
      });
    });

    console.log('Enhanced form handling initialized');
  }

  validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'from_name':
        if (value.length < 2) {
          isValid = false;
          errorMessage = 'Name must be at least 2 characters';
        }
        break;
      case 'reply_to':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          errorMessage = 'Please enter a valid email address';
        }
        break;
      case 'interest_area':
        if (!value || value === '') {
          isValid = false;
          errorMessage = 'Please select your area of interest';
        }
        break;
      case 'message':
        if (value.length < 10) {
          isValid = false;
          errorMessage = 'Message must be at least 10 characters';
        }
        break;
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    } else {
      this.clearFieldError(field);
    }

    return isValid;
  }

  showFieldError(field, message) {
    field.style.borderColor = '#ff4444';
    field.style.boxShadow = '0 0 10px rgba(255, 68, 68, 0.3)';
    field.classList.add('error');
    
    if (this.isAudioInitialized && !field.hasAttribute('data-error-spoken')) {
      field.setAttribute('data-error-spoken', 'true');
      setTimeout(() => {
        this.speak(message);
        setTimeout(() => field.removeAttribute('data-error-spoken'), 3000);
      }, 100);
    }
  }

  clearFieldError(field) {
    field.style.borderColor = '';
    field.style.boxShadow = '';
    field.classList.remove('error');
    field.removeAttribute('data-error-spoken');
  }

  async handleEnhancedFormSubmission(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const submitBtn = document.getElementById('submitBtn');
    const formMessage = document.getElementById('formMessage');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Reset previous states
    this.clearFormMessage(formMessage);
    
    // Validate all fields before submission
    const allInputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isFormValid = true;
    let firstInvalidField = null;

    allInputs.forEach(input => {
      if (!this.validateField(input)) {
        isFormValid = false;
        if (!firstInvalidField) {
          firstInvalidField = input;
        }
      }
    });

    if (!isFormValid) {
      this.showFormMessage(formMessage, 'Please complete all required fields correctly.', 'error');
      if (this.isAudioInitialized) {
        this.speak(this.voiceContent.email.validation);
      }
      if (firstInvalidField) {
        firstInvalidField.focus();
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      // Show loading state
      this.setFormLoadingState(submitBtn, btnText, btnLoading, true);
      this.showFormMessage(formMessage, 'Transmitting your message across digital dimensions...', 'loading');
      
      // Voice feedback
      if (this.isAudioInitialized) {
        this.speak(this.voiceContent.email.loading);
      }

      // Send email through EmailJS (or simulate if not configured)
      if (this.emailManager.isInitialized) {
        await this.emailManager.sendEmail(data);
      } else {
        // Simulate email sending for demo purposes
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Demo mode: Email would be sent with data:', data);
      }
      
      // Success state
      this.setFormSuccessState(submitBtn, btnText, btnLoading);
      this.showFormMessage(formMessage, 'Your message has been successfully launched into the cosmic network! We\'ll respond within 24 hours.', 'success');
      
      // Voice feedback
      if (this.isAudioInitialized) {
        this.speak(this.voiceContent.email.success);
      }

      // Visual effects
      this.createSuccessParticles(submitBtn);
      this.playSound('success', 800, 0.5);

      // Reset form after delay
      setTimeout(() => {
        form.reset();
        this.resetFormState(submitBtn, btnText, btnLoading);
        this.clearFormMessage(formMessage);
        
        // Clear all field errors
        allInputs.forEach(input => this.clearFieldError(input));
      }, 5000);

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Error state
      this.setFormErrorState(submitBtn, btnText, btnLoading);
      
      let errorMessage = 'Cosmic communication interrupted. Please check your details and try again.';
      if (error.message.includes('not initialized')) {
        errorMessage = 'Email system not configured. This is a demo - please set up EmailJS for full functionality.';
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'Too many messages sent. Please wait a moment before trying again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showFormMessage(formMessage, errorMessage, 'error');
      
      // Voice feedback
      if (this.isAudioInitialized) {
        this.speak(this.voiceContent.email.error);
      }

      this.playSound('error', 300, 0.4);

      // Reset form state after delay
      setTimeout(() => {
        this.resetFormState(submitBtn, btnText, btnLoading);
      }, 3000);
    }
  }

  setFormLoadingState(submitBtn, btnText, btnLoading, loading) {
    if (loading) {
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;
      btnText.style.opacity = '0';
      btnLoading.style.opacity = '1';
    }
  }

  setFormSuccessState(submitBtn, btnText, btnLoading) {
    submitBtn.classList.remove('loading');
    submitBtn.classList.add('success');
    btnText.textContent = 'Message Launched! 🚀';
    btnText.style.opacity = '1';
    btnLoading.style.opacity = '0';
  }

  setFormErrorState(submitBtn, btnText, btnLoading) {
    submitBtn.classList.remove('loading');
    submitBtn.classList.add('error');
    btnText.textContent = 'Transmission Failed';
    btnText.style.opacity = '1';
    btnLoading.style.opacity = '0';
  }

  resetFormState(submitBtn, btnText, btnLoading) {
    submitBtn.classList.remove('loading', 'success', 'error');
    submitBtn.disabled = false;
    btnText.textContent = 'Launch Your Message';
    btnText.style.opacity = '1';
    btnLoading.style.opacity = '0';
  }

  showFormMessage(messageEl, text, type) {
    if (!messageEl) return;
    
    messageEl.textContent = text;
    messageEl.className = `form-message ${type} show`;
    
    // Ensure message is visible
    messageEl.style.display = 'block';
    messageEl.style.opacity = '1';
    messageEl.style.transform = 'translateY(0)';
  }

  clearFormMessage(messageEl) {
    if (!messageEl) return;
    
    messageEl.classList.remove('show');
    setTimeout(() => {
      messageEl.className = 'form-message';
      messageEl.textContent = '';
      messageEl.style.display = 'none';
    }, 300);
  }

  createSuccessParticles(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 16; i++) {
      const particle = document.createElement('div');
      particle.className = 'success-particle';
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: #00ff88;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top + rect.height / 2}px;
      `;
      
      document.body.appendChild(particle);
      
      const angle = (i / 16) * Math.PI * 2;
      const distance = 100 + Math.random() * 50;
      const duration = 1000 + Math.random() * 500;
      
      particle.animate([
        { 
          transform: 'translate(0, 0) scale(1)',
          opacity: 1 
        },
        { 
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`,
          opacity: 0 
        }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).addEventListener('finish', () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      });
    }
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
        this.selectVoice(btn.dataset.voice);
        this.updateVoiceUI();
      });
    });
  }

  setupConnectionStatus() {
    this.updateConnectionStatus('disconnected');
  }

  toggleAudioPanel() {
    const panel = document.getElementById('audioPanel');
    const expandedControls = document.getElementById('audioControls');
    
    this.isVoicePanelExpanded = !this.isVoicePanelExpanded;
    
    if (panel && expandedControls) {
      if (this.isVoicePanelExpanded) {
        panel.classList.add('expanded');
        expandedControls.style.maxHeight = '400px';
        expandedControls.style.opacity = '1';
      } else {
        panel.classList.remove('expanded');
        expandedControls.style.maxHeight = '0';
        expandedControls.style.opacity = '0';
      }
    }
  }

  selectVoice(voiceId) {
    this.currentVoice = voiceId;
    this.updateVoiceUI();
    
    // Test the voice with a short phrase
    this.speak(`Hello, I am ${this.voices[voiceId].name}, your ${this.voices[voiceId].personality.toLowerCase()}.`);
  }

  updateVoiceUI() {
    const voiceButtons = document.querySelectorAll('.voice-btn');
    voiceButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.voice === this.currentVoice);
    });
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
  }

  updateSpeakingState(speaking) {
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

  // Updated visual sync - only voice-reactive effects, NO PULSING
  syncVisualElements(speaking) {
    const logo = document.querySelector('.logo-text');
    const crescents = document.querySelectorAll('.crescent');
    const serviceCards = document.querySelectorAll('.service-card');
    const featureCards = document.querySelectorAll('.feature-card');
    
    if (speaking) {
      // Only apply voice-reactive effects during speech
      logo?.classList.add('speaking');
      crescents.forEach(c => c.classList.add('voice-reactive'));
      serviceCards.forEach(c => c.classList.add('speaking'));
      featureCards.forEach(c => c.classList.add('speaking'));
    } else {
      // Return to static, professional appearance
      logo?.classList.remove('speaking');
      crescents.forEach(c => c.classList.remove('voice-reactive'));
      serviceCards.forEach(c => c.classList.remove('speaking'));
      featureCards.forEach(c => c.classList.remove('speaking'));
    }
  }

  async speak(text, voice = this.currentVoice) {
    if (!text || this.isMuted) return false;

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
      this.updateSpeakingState(true);
    };
    
    utterance.onend = () => {
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
    if (!canvas) return;

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
          let content = this.voiceContent[entry.target.dataset.narrate];
          
          // Special handling for features section (Ra Lunai AI)
          if (entry.target.dataset.narrate === 'features') {
            content = this.voiceContent.features;
          }
          
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
    // Card hover narration (excluding service cards which have their own handling)
    document.querySelectorAll('.feature-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (this.isAudioInitialized) {
          setTimeout(() => {
            this.speak(this.voiceContent.interactions.hover);
          }, 300);
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

    // Adjust star count based on device type
    const starCount = this.deviceType === 'mobile' ? 100 : 200;

    for (let i = 0; i < starCount; i++) {
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

    // Adjust particle frequency based on device type
    const frequency = this.deviceType === 'mobile' ? 1000 : 500;
    const maxParticles = this.deviceType === 'mobile' ? 10 : 20;

    setInterval(() => {
      if (this.particles.length < maxParticles) {
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
    }, frequency);
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

  initCursorEffects() {
    let trails = [];
    const maxTrails = this.deviceType === 'mobile' ? 5 : 10;

    // Only add cursor effects on non-touch devices
    if (!('ontouchstart' in window)) {
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
  }

  initSoundEffects() {
    const buttons = document.querySelectorAll('button, .btn, .cta-btn, .service-expand-btn');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        this.playSound('hover', 800, 0.1);
      });

      button.addEventListener('click', () => {
        this.playSound('click', 400, 0.2);
      });
    });

    const cards = document.querySelectorAll('.feature-card, .service-card');
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
    
    // Sound type variations
    switch (type) {
      case 'cosmic':
        oscillator.type = 'sawtooth';
        break;
      case 'success':
        oscillator.type = 'square';
        break;
      case 'error':
        oscillator.type = 'triangle';
        break;
      default:
        oscillator.type = 'sine';
    }
    
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
    if (this.deviceType === 'mobile') {
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

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize the enhanced experience when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing Final Enhanced Lunai Experience with FIXED dropdown');
  new EnhancedLunaiExperience();
});

// Additional interaction handlers
document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        window.scrollTo({
          top: window.innerHeight,
          behavior: 'smooth'
        });
      }
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

  .feature-card.speaking,
  .service-card.speaking {
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

  /* Device-specific optimizations */
  .device-mobile .particles-container {
    opacity: 0.5;
  }

  .device-mobile .starfield::before,
  .device-mobile .starfield::after {
    animation-duration: 180s;
  }

  .device-tablet .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .device-desktop .services-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  /* FIXED: Ensure dropdown is always clickable */
  select#contactInterest {
    pointer-events: auto !important;
    z-index: 1000 !important;
    position: relative !important;
    cursor: pointer !important;
    user-select: auto !important;
    -webkit-user-select: auto !important;
    -moz-user-select: auto !important;
  }

  /* Ensure dropdown doesn't get blocked by other elements */
  .form-group {
    position: relative;
    z-index: 100;
  }

  .form-group:focus-within {
    z-index: 1001;
  }
`;

document.head.appendChild(voiceReactiveStyles);