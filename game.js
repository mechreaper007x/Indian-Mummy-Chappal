/**
 * Indian Mummy: Chappal - Game Engine
 * Created by MISHMAY
 * 
 * A physics-based slingshot game using Matter.js
 */

const Engine = Matter.Engine,
      Composite = Matter.Composite,
      Events = Matter.Events,
      Constraint = Matter.Constraint,
      MouseConstraint = Matter.MouseConstraint,
      Mouse = Matter.Mouse,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Vector = Matter.Vector;

// ========================================
// SOUND MANAGER - Procedural Audio via Web Audio API
// ========================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.initialized = false;
    }

    // Initialize audio context on first user interaction
    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('🔊 Sound initialized');
        } catch (e) {
            console.warn('Audio not supported:', e);
            this.enabled = false;
        }
    }

    // Resume audio context if suspended (browser policy)
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Chappal throw - whoosh sound
    playThrow() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // White noise for whoosh
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.linearRampToValueAtTime(3000, now + 0.1);
        filter.Q.value = 0.5;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.15);
    }

    // Impact hit - thud sound
    playImpact(intensity = 1) {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Low frequency thud
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150 * intensity, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4 * Math.min(intensity, 1.5), now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        
        // Add click transient
        const clickOsc = ctx.createOscillator();
        clickOsc.type = 'square';
        clickOsc.frequency.value = 800;
        
        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.15, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.03);
    }

    // Kid hit - comedic bonk + "ow" sound
    playKidHit() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Bonk - descending tone
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        
        // "Ow" vocal simulation - formant synthesis
        const vowel = ctx.createOscillator();
        vowel.type = 'sawtooth';
        vowel.frequency.setValueAtTime(250, now + 0.05);
        vowel.frequency.linearRampToValueAtTime(180, now + 0.25);
        
        const formant1 = ctx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.value = 700;
        formant1.Q.value = 5;
        
        const formant2 = ctx.createBiquadFilter();
        formant2.type = 'bandpass';
        formant2.frequency.value = 1100;
        formant2.Q.value = 5;
        
        const vGain = ctx.createGain();
        vGain.gain.setValueAtTime(0, now);
        vGain.gain.linearRampToValueAtTime(0.2, now + 0.08);
        vGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        vowel.connect(formant1);
        vowel.connect(formant2);
        formant1.connect(vGain);
        formant2.connect(vGain);
        vGain.connect(ctx.destination);
        vowel.start(now + 0.05);
        vowel.stop(now + 0.3);
    }

    // Win fanfare
    playWin() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Victory melody - C E G C (major arpeggio)
        const notes = [261.63, 329.63, 392.00, 523.25];
        const durations = [0.15, 0.15, 0.15, 0.4];
        let time = now;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.2, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + durations[i]);
            
            time += durations[i] * 0.7;
        });
    }

    // Lose sound - sad trombone style
    playLose() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Descending notes - wah wah waaah
        const notes = [293.66, 277.18, 261.63, 246.94];
        const durations = [0.25, 0.25, 0.25, 0.6];
        let time = now;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, time);
            filter.frequency.linearRampToValueAtTime(500, time + durations[i]);
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + durations[i]);
            
            time += durations[i] * 0.9;
        });
    }

    // UI click sound
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 600;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Reload sound
    playReload() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Click-clack reload
        [0, 0.1].forEach(delay => {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = delay === 0 ? 400 : 600;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.1, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.05);
        });
    }
}

// Global sound manager instance
const sounds = new SoundManager();

// ========================================
// PARTICLE SYSTEM
// ========================================
class Particle {
    constructor(x, y, color, scale) {
        this.x = x || 0; 
        this.y = y || 0; 
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() * 5 + 2) * scale;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.scale = scale;
    }

    update() {
        this.x += this.vx; 
        this.y += this.vy; 
        this.vy += 0.2 * this.scale; 
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life; 
        ctx.fillStyle = this.color; 
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4 * this.scale, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.globalAlpha = 1;
    }
}

// ========================================
// LEVEL DATA
// ========================================
const LEVELS = [
    { name: "Homework Pile", desc: "Hiding behind Maths books." },
    { name: "Sofa Fort", desc: "No TV before exams!" },
    { name: "Cricket Match", desc: "Who broke the window?" },
    { name: "Kitchen Raid", desc: "Stealing Gulab Jamuns?" },
    { name: "Phone Addiction", desc: "Put that screen away!" },
    { name: "Forgot Tiffin", desc: "How will you eat?" },
    { name: "Broken Vase", desc: "That was a gift!" },
    { name: "Sibling Fight", desc: "Stop hitting your brother!" },
    { name: "Relatives Visit", desc: "Go say Namaste." },
    { name: "Exam Tomorrow", desc: "Why are you smiling?" },
    { name: "Late Night", desc: "Go to sleep!" },
    { name: "Messy Room", desc: "Clean this up now." },
    { name: "Lost Remote", desc: "Where did you hide it?" },
    { name: "Wet Towel", desc: "On the bed again?" },
    { name: "Bad Report Card", desc: "Only 98%?" },
    { name: "Vegetables", desc: "Eat your Karela." },
    { name: "Empty Water Bottles", desc: "Fill them up!" },
    { name: "AC On", desc: "Do you think money grows on trees?" },
    { name: "Back Answer", desc: "Don't talk back." },
    { name: "The Final Boss", desc: "Dad is coming home." }
];

// ========================================
// LEVEL BACKGROUNDS - Themed scenes for each level
// ========================================
const LEVEL_BACKGROUNDS = [
    // 0: Homework Pile - Study Room
    { 
        wallColor: '#e8dcc8', floorColor: '#8B4513', 
        theme: 'study', accent: '#4a3728'
    },
    // 1: Sofa Fort - Living Room
    { 
        wallColor: '#f5e6d3', floorColor: '#654321', 
        theme: 'living', accent: '#8B4513'
    },
    // 2: Cricket Match - Outdoor/Balcony
    { 
        wallColor: '#87CEEB', floorColor: '#228B22', 
        theme: 'outdoor', accent: '#32CD32'
    },
    // 3: Kitchen Raid - Kitchen
    { 
        wallColor: '#fff8dc', floorColor: '#cd853f', 
        theme: 'kitchen', accent: '#8B4513'
    },
    // 4: Phone Addiction - Bedroom (Night)
    { 
        wallColor: '#2c3e50', floorColor: '#5D4037', 
        theme: 'bedroom_night', accent: '#1a252f'
    },
    // 5: Forgot Tiffin - Dining Room
    { 
        wallColor: '#ffefd5', floorColor: '#8B4513', 
        theme: 'dining', accent: '#D2691E'
    },
    // 6: Broken Vase - Drawing Room
    { 
        wallColor: '#ffe4c4', floorColor: '#A0522D', 
        theme: 'drawing', accent: '#8B4513'
    },
    // 7: Sibling Fight - Kids Room
    { 
        wallColor: '#87CEEB', floorColor: '#DEB887', 
        theme: 'kids_room', accent: '#FFB6C1'
    },
    // 8: Relatives Visit - Guest Room
    { 
        wallColor: '#faf0e6', floorColor: '#8B4513', 
        theme: 'guest', accent: '#DAA520'
    },
    // 9: Exam Tomorrow - Study Room (Night)
    { 
        wallColor: '#1a1a2e', floorColor: '#4a3728', 
        theme: 'study_night', accent: '#FFD700'
    },
    // 10: Late Night - Bedroom (Dark)
    { 
        wallColor: '#0f0f1a', floorColor: '#3d3d3d', 
        theme: 'bedroom_dark', accent: '#4169E1'
    },
    // 11: Messy Room - Messy Bedroom
    { 
        wallColor: '#dda0dd', floorColor: '#8B4513', 
        theme: 'messy', accent: '#BA55D3'
    },
    // 12: Lost Remote - Living Room (Cozy)
    { 
        wallColor: '#f0e68c', floorColor: '#8B4513', 
        theme: 'living_cozy', accent: '#CD853F'
    },
    // 13: Wet Towel - Bedroom (Morning)
    { 
        wallColor: '#add8e6', floorColor: '#DEB887', 
        theme: 'bedroom_morning', accent: '#4682B4'
    },
    // 14: Bad Report Card - Study Room (Tense)
    { 
        wallColor: '#cd5c5c', floorColor: '#8B0000', 
        theme: 'study_tense', accent: '#B22222'
    },
    // 15: Vegetables - Dining Room (Green)
    { 
        wallColor: '#90EE90', floorColor: '#228B22', 
        theme: 'dining_green', accent: '#006400'
    },
    // 16: Empty Water Bottles - Kitchen (Blue)
    { 
        wallColor: '#b0e0e6', floorColor: '#cd853f', 
        theme: 'kitchen_blue', accent: '#4682B4'
    },
    // 17: AC On - Living Room (Cool)
    { 
        wallColor: '#e0ffff', floorColor: '#8B4513', 
        theme: 'living_cool', accent: '#00CED1'
    },
    // 18: Back Answer - Angry Room
    { 
        wallColor: '#ff6b6b', floorColor: '#8B0000', 
        theme: 'angry', accent: '#DC143C'
    },
    // 19: The Final Boss - Epic Entry
    { 
        wallColor: '#1a0a0a', floorColor: '#2d1810', 
        theme: 'boss', accent: '#FF4500'
    }
];

// ========================================
// LEVEL BUILDER - Angry Birds Style Layouts
// ========================================
const buildLevel = (idx, world, sx, sy, s) => {
    // Helper functions for building structures
    const mkBox = (x, y, sz) => Composite.add(world, Bodies.rectangle(x, y, sz || s, sz || s, { 
        density: 0.002, 
        label: 'Book', 
        friction: 0.6 
    }));
    
    const mkKid = (x, y) => Composite.add(world, Bodies.circle(x, y, s * 0.4, { 
        restitution: 0.6, 
        label: 'Kid', 
        density: 0.003 
    }));
    
    const mkPlank = (x, y, wd, ht) => Composite.add(world, Bodies.rectangle(x, y, wd, ht || s * 0.25, { 
        density: 0.005, 
        label: 'Wood', 
        friction: 0.6 
    }));
    
    const mkVertPlank = (x, y, ht) => mkPlank(x, y, s * 0.25, ht || s * 1.5);

    switch(idx) {
        // ============ EASY LEVELS (1-5) ============
        
        case 0: // Homework Pile - Simple tower
            // Two books as base, kid on top
            mkBox(sx - s * 0.6, sy - s * 0.5, s);
            mkBox(sx + s * 0.6, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 2.5);
            mkKid(sx, sy - s * 1.5);
            break;
            
        case 1: // Sofa Fort - Simple fortification
            // L-shaped cover with kids behind
            mkBox(sx - s * 1.2, sy - s * 0.5, s);
            mkBox(sx + s * 1.2, sy - s * 0.5, s);
            mkBox(sx, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 3.5);
            mkKid(sx - s * 0.6, sy - s * 1.5);
            mkKid(sx + s * 0.6, sy - s * 1.5);
            break;
            
        case 2: // Cricket Match - Triangle formation
            // Pyramid of boxes with kid at top
            mkBox(sx - s, sy - s * 0.5, s);
            mkBox(sx, sy - s * 0.5, s);
            mkBox(sx + s, sy - s * 0.5, s);
            mkBox(sx - s * 0.5, sy - s * 1.5, s);
            mkBox(sx + s * 0.5, sy - s * 1.5, s);
            mkPlank(sx, sy - s * 2.1, s * 2);
            mkKid(sx, sy - s * 2.5);
            break;
            
        case 3: // Kitchen Raid - Counter protection
            // Kids hiding behind counter
            mkVertPlank(sx - s * 1.5, sy - s * 0.8, s * 1.6);
            mkVertPlank(sx + s * 1.5, sy - s * 0.8, s * 1.6);
            mkPlank(sx, sy - s * 1.7, s * 3.5);
            mkKid(sx - s * 0.5, sy - s * 0.5);
            mkKid(sx + s * 0.5, sy - s * 0.5);
            // Pot on top (small box)
            mkBox(sx, sy - s * 2.1, s * 0.6);
            break;
            
        case 4: // Phone Addiction - Bed structure
            // Kid in bed-like enclosure
            mkBox(sx - s * 1.3, sy - s * 0.5, s);
            mkBox(sx + s * 1.3, sy - s * 0.5, s);
            mkVertPlank(sx - s * 1.3, sy - s * 1.4, s * 1.2);
            mkVertPlank(sx + s * 1.3, sy - s * 1.4, s * 1.2);
            mkPlank(sx, sy - s * 2.1, s * 3);
            mkKid(sx, sy - s * 0.5);
            mkKid(sx, sy - s * 2.5);
            break;
            
        // ============ MEDIUM LEVELS (6-10) ============
        
        case 5: // Forgot Tiffin - Table structure
            // Dining table with kids underneath and on top
            mkVertPlank(sx - s * 2, sy - s * 1, s * 2);
            mkVertPlank(sx + s * 2, sy - s * 1, s * 2);
            mkPlank(sx, sy - s * 2.1, s * 5);
            mkKid(sx - s, sy - s * 0.5);
            mkKid(sx + s, sy - s * 0.5);
            mkKid(sx, sy - s * 2.5);
            break;
            
        case 6: // Broken Vase - Multi-level tower
            // Tall tower structure
            mkBox(sx - s * 0.6, sy - s * 0.5, s);
            mkBox(sx + s * 0.6, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 2);
            mkBox(sx - s * 0.4, sy - s * 1.5, s * 0.8);
            mkBox(sx + s * 0.4, sy - s * 1.5, s * 0.8);
            mkPlank(sx, sy - s * 2, s * 1.5);
            mkKid(sx, sy - s * 2.4);
            // Vase (bonus target)
            mkBox(sx + s * 2, sy - s * 0.5, s * 0.5);
            mkKid(sx + s * 2, sy - s * 1);
            break;
            
        case 7: // Sibling Fight - Two towers
            // Twin towers with kids
            // Left tower
            mkBox(sx - s * 2, sy - s * 0.5, s);
            mkVertPlank(sx - s * 2, sy - s * 1.5, s * 1.5);
            mkBox(sx - s * 2, sy - s * 2.4, s * 0.8);
            mkKid(sx - s * 2, sy - s * 3);
            // Right tower
            mkBox(sx + s * 2, sy - s * 0.5, s);
            mkVertPlank(sx + s * 2, sy - s * 1.5, s * 1.5);
            mkBox(sx + s * 2, sy - s * 2.4, s * 0.8);
            mkKid(sx + s * 2, sy - s * 3);
            // Bridge connecting
            mkPlank(sx, sy - s * 2.4, s * 3);
            mkKid(sx, sy - s * 2.8);
            break;
            
        case 8: // Relatives Visit - Guest room setup
            // Enclosed structure
            mkBox(sx - s * 2, sy - s * 0.5, s);
            mkBox(sx - s * 1, sy - s * 0.5, s);
            mkBox(sx + s * 1, sy - s * 0.5, s);
            mkBox(sx + s * 2, sy - s * 0.5, s);
            mkVertPlank(sx - s * 2.2, sy - s * 1.5, s * 1.5);
            mkVertPlank(sx + s * 2.2, sy - s * 1.5, s * 1.5);
            mkPlank(sx, sy - s * 2.3, s * 5);
            mkKid(sx - s, sy - s * 1.2);
            mkKid(sx + s, sy - s * 1.2);
            mkKid(sx, sy - s * 2.7);
            break;
            
        case 9: // Exam Tomorrow - Study desk fortress
            // Heavy fortification
            mkBox(sx - s * 1.5, sy - s * 0.5, s);
            mkBox(sx, sy - s * 0.5, s);
            mkBox(sx + s * 1.5, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 4);
            mkBox(sx - s * 1, sy - s * 1.6, s);
            mkBox(sx + s * 1, sy - s * 1.6, s);
            mkPlank(sx, sy - s * 2.2, s * 3);
            mkKid(sx, sy - s * 1.6);
            mkKid(sx, sy - s * 2.6);
            // Books stacked on side
            mkBox(sx + s * 3, sy - s * 0.5, s * 0.8);
            mkBox(sx + s * 3, sy - s * 1.2, s * 0.8);
            mkKid(sx + s * 3, sy - s * 1.8);
            break;
            
        // ============ HARD LEVELS (11-15) ============
        
        case 10: // Late Night - Bed fortress
            // Complex bed structure
            mkBox(sx - s * 2.5, sy - s * 0.5, s);
            mkBox(sx - s * 1.5, sy - s * 0.5, s);
            mkBox(sx + s * 1.5, sy - s * 0.5, s);
            mkBox(sx + s * 2.5, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 6);
            // Blanket fort on top
            mkVertPlank(sx - s * 2, sy - s * 2, s * 1.5);
            mkVertPlank(sx + s * 2, sy - s * 2, s * 1.5);
            mkPlank(sx, sy - s * 2.8, s * 4.5);
            mkKid(sx - s, sy - s * 1.5);
            mkKid(sx, sy - s * 1.5);
            mkKid(sx + s, sy - s * 1.5);
            mkKid(sx, sy - s * 3.2);
            break;
            
        case 11: // Messy Room - Chaotic pile
            // Random-looking but strategic placement
            mkBox(sx - s * 2, sy - s * 0.5, s);
            mkBox(sx - s * 0.8, sy - s * 0.5, s);
            mkBox(sx + s * 0.5, sy - s * 0.5, s);
            mkBox(sx + s * 1.8, sy - s * 0.5, s);
            mkBox(sx - s * 1.4, sy - s * 1.5, s);
            mkBox(sx + s * 1.2, sy - s * 1.5, s);
            mkPlank(sx, sy - s * 2.2, s * 4);
            mkKid(sx - s * 2, sy - s * 1.2);
            mkKid(sx + s * 2, sy - s * 1.2);
            mkKid(sx - s * 0.5, sy - s * 2.6);
            mkKid(sx + s * 0.5, sy - s * 2.6);
            break;
            
        case 12: // Lost Remote - Sofa maze
            // Multiple hiding spots
            mkVertPlank(sx - s * 3, sy - s * 1, s * 2);
            mkVertPlank(sx - s * 1.5, sy - s * 1, s * 2);
            mkVertPlank(sx + s * 1.5, sy - s * 1, s * 2);
            mkVertPlank(sx + s * 3, sy - s * 1, s * 2);
            mkPlank(sx - s * 2.25, sy - s * 2.1, s * 2);
            mkPlank(sx + s * 2.25, sy - s * 2.1, s * 2);
            mkKid(sx - s * 2.25, sy - s * 0.5);
            mkKid(sx, sy - s * 0.5);
            mkKid(sx + s * 2.25, sy - s * 0.5);
            mkKid(sx - s * 2.25, sy - s * 2.5);
            mkKid(sx + s * 2.25, sy - s * 2.5);
            break;
            
        case 13: // Wet Towel - Bedroom layers
            // Stacked horizontal layers
            for (let i = 0; i < 3; i++) {
                mkBox(sx - s * 1.5, sy - s * 0.5 - i * s * 1.2, s);
                mkBox(sx + s * 1.5, sy - s * 0.5 - i * s * 1.2, s);
                mkPlank(sx, sy - s * 1 - i * s * 1.2, s * 4);
            }
            mkKid(sx - s * 0.5, sy - s * 0.5);
            mkKid(sx + s * 0.5, sy - s * 0.5);
            mkKid(sx, sy - s * 1.7);
            mkKid(sx, sy - s * 2.9);
            mkKid(sx, sy - s * 4.1);
            break;
            
        case 14: // Bad Report Card - Defensive walls
            // Strong defensive structure
            mkBox(sx - s * 2.5, sy - s * 0.5, s);
            mkBox(sx - s * 2.5, sy - s * 1.5, s);
            mkBox(sx + s * 2.5, sy - s * 0.5, s);
            mkBox(sx + s * 2.5, sy - s * 1.5, s);
            mkPlank(sx, sy - s * 2.1, s * 6);
            // Inner fortress
            mkBox(sx - s, sy - s * 0.5, s);
            mkBox(sx + s, sy - s * 0.5, s);
            mkVertPlank(sx - s, sy - s * 1.5, s * 1.5);
            mkVertPlank(sx + s, sy - s * 1.5, s * 1.5);
            mkPlank(sx, sy - s * 2.5, s * 2.5);
            mkKid(sx, sy - s * 0.5);
            mkKid(sx, sy - s * 1.5);
            mkKid(sx, sy - s * 2.9);
            mkKid(sx - s * 2.5, sy - s * 2.5);
            mkKid(sx + s * 2.5, sy - s * 2.5);
            break;
            
        // ============ EXPERT LEVELS (16-20) ============
        
        case 15: // Vegetables - Dining fortress
            // Table with cover
            mkVertPlank(sx - s * 3, sy - s * 1.2, s * 2.4);
            mkVertPlank(sx + s * 3, sy - s * 1.2, s * 2.4);
            mkPlank(sx, sy - s * 2.5, s * 7);
            // Under table
            mkBox(sx - s * 1.5, sy - s * 0.5, s);
            mkBox(sx + s * 1.5, sy - s * 0.5, s);
            mkVertPlank(sx, sy - s * 1.2, s * 1.8);
            // On table
            mkBox(sx - s, sy - s * 3, s);
            mkBox(sx + s, sy - s * 3, s);
            mkPlank(sx, sy - s * 3.6, s * 3);
            mkKid(sx - s * 2, sy - s * 0.5);
            mkKid(sx + s * 2, sy - s * 0.5);
            mkKid(sx, sy - s * 1.8);
            mkKid(sx - s * 0.5, sy - s * 4);
            mkKid(sx + s * 0.5, sy - s * 4);
            break;
            
        case 16: // Empty Water Bottles - Bottle tower
            // Tall unstable tower
            for (let i = 0; i < 4; i++) {
                mkBox(sx - s * 0.6, sy - s * 0.5 - i * s, s * 0.8);
                mkBox(sx + s * 0.6, sy - s * 0.5 - i * s, s * 0.8);
            }
            mkPlank(sx, sy - s * 4.6, s * 2);
            mkKid(sx, sy - s * 5);
            // Side structure
            mkBox(sx + s * 2.5, sy - s * 0.5, s);
            mkBox(sx + s * 2.5, sy - s * 1.5, s);
            mkKid(sx + s * 2.5, sy - s * 2.2);
            mkBox(sx - s * 2.5, sy - s * 0.5, s);
            mkBox(sx - s * 2.5, sy - s * 1.5, s);
            mkKid(sx - s * 2.5, sy - s * 2.2);
            mkKid(sx, sy - s * 2);
            mkKid(sx, sy - s * 3);
            break;
            
        case 17: // AC On - Cool room structure
            // Complex room layout
            // Left wall
            mkBox(sx - s * 3, sy - s * 0.5, s);
            mkBox(sx - s * 3, sy - s * 1.5, s);
            mkBox(sx - s * 3, sy - s * 2.5, s);
            // Right wall
            mkBox(sx + s * 3, sy - s * 0.5, s);
            mkBox(sx + s * 3, sy - s * 1.5, s);
            mkBox(sx + s * 3, sy - s * 2.5, s);
            // Ceiling
            mkPlank(sx, sy - s * 3.1, s * 7);
            // Internal pillars
            mkVertPlank(sx - s * 1, sy - s * 1.5, s * 2.5);
            mkVertPlank(sx + s * 1, sy - s * 1.5, s * 2.5);
            mkPlank(sx, sy - s * 2, s * 2.5);
            // Kids everywhere
            mkKid(sx - s * 2, sy - s * 0.5);
            mkKid(sx, sy - s * 0.5);
            mkKid(sx + s * 2, sy - s * 0.5);
            mkKid(sx - s * 2, sy - s * 1.8);
            mkKid(sx + s * 2, sy - s * 1.8);
            mkKid(sx, sy - s * 3.5);
            break;
            
        case 18: // Back Answer - Angry structure
            // Aggressive defensive layout
            // Triple tower
            for (let t = -1; t <= 1; t++) {
                mkBox(sx + t * s * 2, sy - s * 0.5, s);
                mkBox(sx + t * s * 2, sy - s * 1.5, s);
                mkVertPlank(sx + t * s * 2, sy - s * 2.5, s * 1.5);
                mkKid(sx + t * s * 2, sy - s * 3.4);
            }
            // Connecting platforms
            mkPlank(sx - s, sy - s * 2.5, s * 2.5);
            mkPlank(sx + s, sy - s * 2.5, s * 2.5);
            mkKid(sx - s, sy - s * 2.9);
            mkKid(sx + s, sy - s * 2.9);
            // Inner protected kids
            mkKid(sx - s, sy - s * 0.5);
            mkKid(sx + s, sy - s * 0.5);
            break;
            
        case 19: // The Final Boss - Ultimate fortress
            // EPIC FINAL LEVEL
            // Outer walls
            mkBox(sx - s * 4, sy - s * 0.5, s);
            mkBox(sx - s * 4, sy - s * 1.5, s);
            mkBox(sx - s * 4, sy - s * 2.5, s);
            mkBox(sx + s * 4, sy - s * 0.5, s);
            mkBox(sx + s * 4, sy - s * 1.5, s);
            mkBox(sx + s * 4, sy - s * 2.5, s);
            mkPlank(sx, sy - s * 3.1, s * 9);
            // Inner structure - first layer
            mkBox(sx - s * 2, sy - s * 0.5, s);
            mkBox(sx + s * 2, sy - s * 0.5, s);
            mkVertPlank(sx - s * 2, sy - s * 1.6, s * 1.8);
            mkVertPlank(sx + s * 2, sy - s * 1.6, s * 1.8);
            mkPlank(sx, sy - s * 2.6, s * 4.5);
            // Core fortress
            mkBox(sx - s * 0.6, sy - s * 0.5, s);
            mkBox(sx + s * 0.6, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 2);
            mkVertPlank(sx - s * 0.6, sy - s * 1.8, s * 1.2);
            mkVertPlank(sx + s * 0.6, sy - s * 1.8, s * 1.2);
            mkPlank(sx, sy - s * 2.5, s * 1.8);
            // BOSS (hidden kid in center)
            mkKid(sx, sy - s * 0.5);
            // Guards
            mkKid(sx - s * 3, sy - s * 0.5);
            mkKid(sx + s * 3, sy - s * 0.5);
            mkKid(sx - s * 1.3, sy - s * 1.5);
            mkKid(sx + s * 1.3, sy - s * 1.5);
            // Top guards
            mkKid(sx, sy - s * 2.9);
            mkKid(sx - s * 2, sy - s * 3.5);
            mkKid(sx + s * 2, sy - s * 3.5);
            // Outer guards
            mkKid(sx - s * 4, sy - s * 3.2);
            mkKid(sx + s * 4, sy - s * 3.2);
            break;
            
        default:
            // Fallback - simple structure
            mkBox(sx - s, sy - s * 0.5, s);
            mkBox(sx + s, sy - s * 0.5, s);
            mkPlank(sx, sy - s * 1.1, s * 3);
            mkKid(sx, sy - s * 1.5);
    }
};

// ========================================
// MAIN GAME CLASS
// ========================================
class Game {
    constructor() {
        this.canvas = document.getElementById('world');
        this.ctx = this.canvas.getContext('2d');
        this.engine = Engine.create({ 
            positionIterations: 16, 
            velocityIterations: 16 
        });
        this.world = this.engine.world;
        
        this.currentLevelIdx = 0;
        this.particles = [];
        this.ammo = 6;
        this.isAiming = false;
        this.isPaused = false;
        this.gameActive = false;
        this.isGameOver = false;
        this.shotFired = false;
        this.isReloading = false;
        this.chappal = null;
        this.sling = null;

        this.initResize();
        this.setupCollisionEvents();
        this.setupMouse();
        this.initLevelGrid();
        this.setupFullscreenListener();
        
        // Start Loop
        this.loop();
    }

    initResize() {
        this.handleResize = () => {
            this.width = document.documentElement.clientWidth;
            this.height = document.documentElement.clientHeight;
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            const baseWidth = 1000;
            this.scale = Math.max(0.5, Math.min(this.width / baseWidth, this.height / 600) * 1.5);
            if (this.scale > 1.5) this.scale = 1.5;
            this.anchor = { 
                x: Math.max(80 * this.scale, this.width * 0.15), 
                y: this.height - (150 * this.scale) 
            };
            this.targetStartX = this.width * 0.75;
            this.targetStartY = this.height - (50 * this.scale);
        };
        this.handleResize();
        window.addEventListener('resize', () => setTimeout(() => this.handleResize(), 200));
    }

    initLevelGrid() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        LEVELS.forEach((lvl, i) => {
            const btn = document.createElement('div');
            btn.className = 'lvl-btn';
            btn.innerText = i + 1;
            btn.onclick = () => {
                sounds.playClick();
                this.currentLevelIdx = i;
                this.startGame();
            };
            grid.appendChild(btn);
        });
    }

    // ========================================
    // UI FLOW
    // ========================================
    showStartScreen() {
        this.gameActive = false;
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('level-screen').classList.add('hidden');
        document.getElementById('ui-layer').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-modal').classList.add('hidden');
    }

    showLevelSelect() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('level-screen').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
    }

    startGame() {
        // Initialize sound on first game start (requires user interaction)
        sounds.init();
        sounds.playClick();
        
        this.gameActive = true;
        this.isPaused = false;
        document.getElementById('level-screen').classList.add('hidden');
        document.getElementById('ui-layer').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-modal').classList.add('hidden');
        this.resetLevel();
    }

    togglePause() {
        if (!this.gameActive) return;
        this.isPaused = !this.isPaused;
        const pauseScreen = document.getElementById('pause-screen');
        if (this.isPaused) pauseScreen.classList.remove('hidden');
        else pauseScreen.classList.add('hidden');
    }

    // Toggle fullscreen mode for mobile gameplay
    toggleFullscreen() {
        const elem = document.documentElement;
        
        const isFullscreen = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement;

        if (!isFullscreen) {
            // Enter fullscreen
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        
        sounds.playClick();
    }

    // Listen for fullscreen changes to update button icon and resize
    setupFullscreenListener() {
        const updateFullscreen = () => {
            const btn = document.getElementById('fullscreen-btn');
            const isFullscreen = document.fullscreenElement || 
                                document.webkitFullscreenElement || 
                                document.mozFullScreenElement || 
                                document.msFullscreenElement;
            
            if (btn) {
                btn.innerText = isFullscreen ? '✕' : '⊞';
            }
            
            // Trigger resize after a short delay to let fullscreen settle
            setTimeout(() => {
                this.handleResize();
                // Reset level to fix physics positioning if game is active
                if (this.gameActive && !this.isPaused) {
                    this.resetLevel();
                }
            }, 100);
        };
        
        document.addEventListener('fullscreenchange', updateFullscreen);
        document.addEventListener('webkitfullscreenchange', updateFullscreen);
        document.addEventListener('mozfullscreenchange', updateFullscreen);
        document.addEventListener('MSFullscreenChange', updateFullscreen);
    }

    resetLevel() {
        Composite.clear(this.world);
        Engine.clear(this.engine);
        
        document.getElementById('game-modal').classList.add('hidden');
        document.getElementById('status-display').classList.remove('visible');
        
        this.isGameOver = false; 
        this.ammo = 6; 
        this.shotFired = false; 
        this.isReloading = false;
        this.isAiming = false;
        
        // Update HUD
        const lvlData = LEVELS[this.currentLevelIdx];
        document.getElementById('level-name-display').innerText = `${this.currentLevelIdx + 1}. ${lvlData.name}`;
        this.updateUI();

        // Environment
        const groundH = 100 * this.scale;
        const ground = Bodies.rectangle(
            this.width / 2, 
            this.height + groundH / 2 - (40 * this.scale), 
            this.width * 2, 
            groundH, 
            { isStatic: true, label: 'Ground' }
        );
        const wallR = Bodies.rectangle(
            this.width + 100, 
            this.height / 2, 
            200, 
            this.height * 2, 
            { isStatic: true }
        );
        const ceiling = Bodies.rectangle(
            this.width / 2, 
            -500, 
            this.width * 2, 
            1000, 
            { isStatic: true }
        );
        Composite.add(this.world, [ground, wallR, ceiling]);
        
        this.setupMouse(); // Re-bind mouse to new world
        buildLevel(this.currentLevelIdx, this.world, this.targetStartX, this.targetStartY, 50 * this.scale);
        this.spawnChappal();
    }

    // ========================================
    // GAME LOGIC
    // ========================================
    setupCollisionEvents() {
        Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach((pair) => {
                const bodyA = pair.bodyA; 
                const bodyB = pair.bodyB;
                let chappal = (bodyA.label === 'Chappal') ? bodyA : (bodyB.label === 'Chappal') ? bodyB : null;
                let obstacle = (chappal === bodyA) ? bodyB : bodyA;

                if (chappal && (obstacle.label === 'Book' || obstacle.label === 'Wood')) {
                    if (chappal.speed > 8) {
                        const contact = pair.collision.supports[0] || obstacle.position;
                        this.poof(contact.x, contact.y, '#EEE', 5);
                        // Play impact sound with intensity based on speed
                        sounds.playImpact(chappal.speed / 15);
                    }
                }
            });
        });
    }

    setupMouse() {
        const mouse = Mouse.create(this.canvas);
        const mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: { stiffness: 0.05, render: { visible: false } }
        });
        mouseConstraint.collisionFilter.mask = 0x0001;
        Composite.add(this.world, mouseConstraint);

        Events.on(mouseConstraint, 'startdrag', (e) => {
            if (e.body !== this.chappal) e.source.constraint.bodyB = null; 
            else if (!this.shotFired) this.isAiming = true;
        });
        
        Events.on(mouseConstraint, 'enddrag', (e) => {
            if (e.body === this.chappal && !this.shotFired) {
                this.isAiming = false;
                // THROW LOGIC
                const mousePos = e.mouse.position;
                const forceVector = Vector.sub(mousePos, this.anchor);
                
                if (forceVector.x > 0) { // Dragging right
                    setTimeout(() => { 
                        if (this.sling) {
                            Composite.remove(this.world, this.sling); 
                            this.sling = null; 
                            this.chappal.frictionAir = 0.001; 
                            // Godspeed Velocity
                            const throwForce = Math.min(Vector.magnitude(forceVector) * 0.25, 50);
                            const throwDir = Vector.normalise(forceVector);
                            Body.setVelocity(this.chappal, Vector.mult(throwDir, throwForce));
                            
                            // Whoosh sound on throw!
                            sounds.playThrow();
                            
                            this.shotFired = true; 
                            this.ammo--; 
                            this.updateUI(); 
                            this.checkForNextShot();
                        }
                    }, 20);
                } else {
                    // Cancel/Drop if dragged left
                    setTimeout(() => { 
                        if (this.sling) { 
                            Composite.remove(this.world, this.sling); 
                            this.sling = null; 
                            this.chappal.frictionAir = 0.002; 
                            this.shotFired = true; 
                            this.ammo--; 
                            this.updateUI(); 
                            this.checkForNextShot(); 
                        }
                    }, 20);
                }
            }
        });
    }

    spawnChappal() {
        if (this.ammo <= 0) return;
        const w = 50 * this.scale; 
        const h = 20 * this.scale;
        this.chappal = Bodies.rectangle(this.anchor.x, this.anchor.y, w, h, { 
            chamfer: { radius: h * 0.4 }, 
            density: 0.012, 
            restitution: 0.6, 
            label: 'Chappal', 
            frictionAir: 0.05 
        });
        this.sling = Constraint.create({ 
            pointA: { x: this.anchor.x, y: this.anchor.y }, 
            bodyB: this.chappal, 
            stiffness: 0.1, 
            length: 0 
        });
        Composite.add(this.world, [this.chappal, this.sling]);
        this.shotFired = false; 
        this.isReloading = false;
        document.getElementById('status-display').classList.remove('visible');
    }

    checkForNextShot() {
        const checkInterval = setInterval(() => {
            if (!this.chappal) { 
                clearInterval(checkInterval); 
                return; 
            }
            if (this.chappal.speed < 0.2 || this.chappal.position.x > this.width || this.chappal.position.y > this.height) {
                clearInterval(checkInterval);
                if (this.chappal) Composite.remove(this.world, this.chappal); 
                this.chappal = null;
                if (this.checkWinCondition()) return;
                if (this.ammo > 0) {
                    this.isReloading = true;
                    document.getElementById('status-display').innerText = "RELOADING...";
                    document.getElementById('status-display').classList.add('visible');
                    sounds.playReload();
                    setTimeout(() => this.spawnChappal(), 1000);
                } else { 
                    this.showLossScreen(); 
                }
            }
        }, 500);
    }

    checkWinCondition() {
        const bodies = Composite.allBodies(this.world);
        if (bodies.filter(b => b.label === 'Kid').length === 0) { 
            this.isGameOver = true; 
            this.showWinScreen(); 
            return true; 
        }
        return false;
    }

    updateUI() { 
        document.getElementById('ammo-count').innerText = this.ammo; 
    }

    showWinScreen() {
        // Victory fanfare!
        sounds.playWin();
        
        const modal = document.getElementById('game-modal');
        const title = document.getElementById('modal-title');
        const desc = document.getElementById('modal-desc');
        const btn = document.getElementById('modal-btn');
        modal.dataset.action = 'next';
        
        if (this.currentLevelIdx === LEVELS.length - 1) { 
            title.innerText = "ALL CLEARED!"; 
            desc.innerText = "Mishmay would be proud."; 
            btn.innerText = "MENU"; 
            modal.dataset.action = 'menu';
        } else { 
            title.innerText = "CLEARED!"; 
            desc.innerText = LEVELS[this.currentLevelIdx].desc; 
            btn.innerText = "NEXT LEVEL"; 
        }
        modal.classList.remove('hidden');
    }

    showLossScreen() {
        // Sad trombone :(
        sounds.playLose();
        
        const modal = document.getElementById('game-modal');
        modal.dataset.action = 'retry';
        document.getElementById('modal-title').innerText = "FAILED!";
        document.getElementById('modal-desc').innerText = "Out of chappals!";
        document.getElementById('modal-btn').innerText = "RETRY";
        modal.classList.remove('hidden');
    }

    handleModalAction() {
        const modal = document.getElementById('game-modal');
        const action = modal.dataset.action;
        if (action === 'next') this.nextLevel();
        else if (action === 'retry') this.resetLevel();
        else if (action === 'menu') this.showStartScreen();
    }

    /**
     * Advance to the next level
     * BUG FIX: This method was missing in the original code!
     */
    nextLevel() {
        this.currentLevelIdx++;
        if (this.currentLevelIdx >= LEVELS.length) {
            this.currentLevelIdx = 0;
            this.showStartScreen();
        } else {
            this.startGame();
        }
    }

    poof(x, y, color = '#FF5722', count = 15) { 
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color || '#FF5722', this.scale)); 
        }
    }

    update() {
        if (!this.isPaused && this.gameActive) {
            Engine.update(this.engine, 1000 / 60);
            
            // Godspeed Governor
            if (this.chappal) {
                const maxSpeed = 120 * this.scale; 
                if (this.chappal.speed > maxSpeed) {
                    Body.setVelocity(this.chappal, Vector.mult(Vector.normalise(this.chappal.velocity), maxSpeed));
                }
            }

            if (!this.isGameOver) {
                Composite.allBodies(this.world).forEach(b => {
                    if (b.label === 'Kid') {
                        if (b.position.y > this.height || b.position.x > this.width || (b.speed > 8 * this.scale)) {
                            this.poof(b.position.x, b.position.y);
                            // Bonk + "Ow!" sound when kid gets hit
                            sounds.playKidHit();
                            Composite.remove(this.world, b);
                        }
                    }
                });
            }
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].update(); 
                if (this.particles[i].life <= 0) this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        try {
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            if (this.gameActive) {
                // Draw themed background
                this.drawBackground();

                this.drawMummy(this.anchor.x - (60 * this.scale), this.anchor.y + (30 * this.scale), this.scale);

                Composite.allBodies(this.world).forEach(b => {
                    this.ctx.save(); 
                    this.ctx.translate(b.position.x, b.position.y); 
                    this.ctx.rotate(b.angle);
                    const w = b.bounds.max.x - b.bounds.min.x; 
                    const h = b.bounds.max.y - b.bounds.min.y;
                    if (b.label === 'Chappal') this.drawChappal(w, h);
                    else if (b.label === 'Kid') this.drawKid(w / 2);
                    else if (b.label === 'Book') this.drawBook(w, h);
                    else if (b.label === 'Wood') this.drawWood(w, h);
                    this.ctx.restore();
                });
                
                this.particles.forEach(p => p.draw(this.ctx));
            }
        } catch (e) { 
            console.error(e); 
        }
    }

    // ========================================
    // THEMED BACKGROUND DRAWING
    // ========================================
    drawBackground() {
        const bg = LEVEL_BACKGROUNDS[this.currentLevelIdx] || LEVEL_BACKGROUNDS[0];
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        const s = this.scale;
        const floorH = 40 * s;
        
        // Draw wall
        ctx.fillStyle = bg.wallColor;
        ctx.fillRect(0, 0, w, h);
        
        // Draw floor
        ctx.fillStyle = bg.floorColor;
        ctx.fillRect(0, h - floorH, w, floorH);
        ctx.fillStyle = this.darkenColor(bg.floorColor, 20);
        ctx.fillRect(0, h - floorH, w, floorH * 0.15);
        
        // Theme-specific decorations
        switch(bg.theme) {
            case 'study':
                this.drawStudyRoom(ctx, w, h, s, bg);
                break;
            case 'living':
                this.drawLivingRoom(ctx, w, h, s, bg);
                break;
            case 'outdoor':
                this.drawOutdoor(ctx, w, h, s, bg);
                break;
            case 'kitchen':
                this.drawKitchen(ctx, w, h, s, bg);
                break;
            case 'bedroom_night':
                this.drawBedroomNight(ctx, w, h, s, bg);
                break;
            case 'dining':
                this.drawDiningRoom(ctx, w, h, s, bg);
                break;
            case 'drawing':
                this.drawDrawingRoom(ctx, w, h, s, bg);
                break;
            case 'kids_room':
                this.drawKidsRoom(ctx, w, h, s, bg);
                break;
            case 'guest':
                this.drawGuestRoom(ctx, w, h, s, bg);
                break;
            case 'study_night':
                this.drawStudyNight(ctx, w, h, s, bg);
                break;
            case 'bedroom_dark':
                this.drawBedroomDark(ctx, w, h, s, bg);
                break;
            case 'messy':
                this.drawMessyRoom(ctx, w, h, s, bg);
                break;
            case 'living_cozy':
                this.drawLivingCozy(ctx, w, h, s, bg);
                break;
            case 'bedroom_morning':
                this.drawBedroomMorning(ctx, w, h, s, bg);
                break;
            case 'study_tense':
                this.drawStudyTense(ctx, w, h, s, bg);
                break;
            case 'dining_green':
                this.drawDiningGreen(ctx, w, h, s, bg);
                break;
            case 'kitchen_blue':
                this.drawKitchenBlue(ctx, w, h, s, bg);
                break;
            case 'living_cool':
                this.drawLivingCool(ctx, w, h, s, bg);
                break;
            case 'angry':
                this.drawAngryRoom(ctx, w, h, s, bg);
                break;
            case 'boss':
                this.drawBossRoom(ctx, w, h, s, bg);
                break;
        }
    }
    
    // Helper to darken colors
    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    // Study Room - Bookshelf and desk lamp
    drawStudyRoom(ctx, w, h, s, bg) {
        // Bookshelf on right
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w - 120 * s, h - 250 * s, 100 * s, 210 * s);
        // Shelf dividers
        ctx.fillStyle = '#654321';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(w - 120 * s, h - 250 * s + i * 70 * s, 100 * s, 8 * s);
        }
        // Books on shelf
        const bookColors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = bookColors[i % bookColors.length];
            ctx.fillRect(w - 115 * s + i * 22 * s, h - 240 * s, 18 * s, 50 * s);
        }
        // Wall clock
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(w - 200 * s, 80 * s, 30 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3 * s;
        ctx.stroke();
    }
    
    // Living Room - TV and sofa silhouette
    drawLivingRoom(ctx, w, h, s, bg) {
        // TV on right wall
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(w - 180 * s, h - 280 * s, 150 * s, 90 * s);
        ctx.fillStyle = '#4a90d9';
        ctx.fillRect(w - 175 * s, h - 275 * s, 140 * s, 80 * s);
        // TV stand
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(w - 170 * s, h - 190 * s, 130 * s, 150 * s);
        // Curtain on left
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(20 * s, 20 * s, 60 * s, h - 100 * s);
        ctx.fillRect(90 * s, 20 * s, 10 * s, h - 100 * s);
    }
    
    // Outdoor - Sky, clouds, grass
    drawOutdoor(ctx, w, h, s, bg) {
        // Sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(w - 100 * s, 80 * s, 50 * s, 0, Math.PI * 2);
        ctx.fill();
        // Clouds
        ctx.fillStyle = '#fff';
        this.drawCloud(ctx, 100 * s, 60 * s, s);
        this.drawCloud(ctx, w / 2, 40 * s, s * 0.8);
        // Trees in background
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.moveTo(w - 250 * s, h - 40 * s);
        ctx.lineTo(w - 200 * s, h - 200 * s);
        ctx.lineTo(w - 150 * s, h - 40 * s);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w - 210 * s, h - 80 * s, 20 * s, 40 * s);
    }
    
    drawCloud(ctx, x, y, s) {
        ctx.beginPath();
        ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
        ctx.arc(x + 25 * s, y - 10 * s, 25 * s, 0, Math.PI * 2);
        ctx.arc(x + 50 * s, y, 20 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Kitchen - Cabinets, stove, utensils
    drawKitchen(ctx, w, h, s, bg) {
        // Kitchen counter
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(w - 300 * s, h - 150 * s, 280 * s, 110 * s);
        // Counter top
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(w - 300 * s, h - 150 * s, 280 * s, 15 * s);
        // Stove
        ctx.fillStyle = '#2F4F4F';
        ctx.fillRect(w - 200 * s, h - 135 * s, 80 * s, 95 * s);
        // Burners
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(w - 180 * s, h - 100 * s, 15 * s, 0, Math.PI * 2);
        ctx.arc(w - 140 * s, h - 100 * s, 15 * s, 0, Math.PI * 2);
        ctx.fill();
        // Pot
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(w - 190 * s, h - 130 * s, 30 * s, 25 * s);
        // Upper cabinets
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w - 300 * s, 50 * s, 280 * s, 80 * s);
        // Cabinet doors
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3 * s;
        ctx.strokeRect(w - 290 * s, 55 * s, 85 * s, 70 * s);
        ctx.strokeRect(w - 195 * s, 55 * s, 85 * s, 70 * s);
        ctx.strokeRect(w - 100 * s, 55 * s, 75 * s, 70 * s);
    }
    
    // Bedroom Night - Bed, moonlight, phone glow
    drawBedroomNight(ctx, w, h, s, bg) {
        // Window with moon
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(w - 150 * s, 30 * s, 120 * s, 100 * s);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(w - 145 * s, 35 * s, 110 * s, 90 * s);
        // Moon
        ctx.fillStyle = '#FFFACD';
        ctx.beginPath();
        ctx.arc(w - 90 * s, 70 * s, 25 * s, 0, Math.PI * 2);
        ctx.fill();
        // Stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(w - 140 * s + i * 25 * s, 50 * s + (i % 2) * 20 * s, 2 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        // Phone glow effect
        const gradient = ctx.createRadialGradient(w * 0.6, h - 100 * s, 0, w * 0.6, h - 100 * s, 100 * s);
        gradient.addColorStop(0, 'rgba(66, 133, 244, 0.3)');
        gradient.addColorStop(1, 'rgba(66, 133, 244, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(w * 0.5, h - 200 * s, 200 * s, 200 * s);
    }
    
    // Dining Room - Table silhouette
    drawDiningRoom(ctx, w, h, s, bg) {
        // Dining table
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(w * 0.4, h - 120 * s, 200 * s, 15 * s);
        // Table legs
        ctx.fillRect(w * 0.42, h - 105 * s, 15 * s, 65 * s);
        ctx.fillRect(w * 0.4 + 175 * s, h - 105 * s, 15 * s, 65 * s);
        // Plates
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h - 125 * s, 25 * s, 8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tiffin box hint
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(w * 0.55, h - 140 * s, 30 * s, 20 * s);
    }
    
    // Drawing Room - Vase, paintings
    drawDrawingRoom(ctx, w, h, s, bg) {
        // Painting frames on wall
        ctx.fillStyle = '#654321';
        ctx.fillRect(w - 200 * s, 50 * s, 100 * s, 80 * s);
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(w - 195 * s, 55 * s, 90 * s, 70 * s);
        // Decorative plant
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(80 * s, h - 150 * s, 40 * s, 110 * s);
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(100 * s, h - 160 * s, 40 * s, 0, Math.PI * 2);
        ctx.fill();
        // Broken vase hint
        ctx.fillStyle = '#E6E6FA';
        ctx.beginPath();
        ctx.moveTo(w * 0.6, h - 40 * s);
        ctx.lineTo(w * 0.6 + 20 * s, h - 100 * s);
        ctx.lineTo(w * 0.6 + 40 * s, h - 40 * s);
        ctx.fill();
    }
    
    // Kids Room - Colorful, toys
    drawKidsRoom(ctx, w, h, s, bg) {
        // Colorful wall decorations
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = colors[i];
            ctx.beginPath();
            ctx.arc(50 * s + i * 80 * s, 80 * s, 25 * s, 0, Math.PI * 2);
            ctx.fill();
        }
        // Toy blocks
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(w - 100 * s, h - 80 * s, 30 * s, 30 * s);
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(w - 130 * s, h - 80 * s, 25 * s, 30 * s);
        // Poster
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(w - 180 * s, 40 * s, 80 * s, 60 * s);
    }
    
    // Guest Room - Elegant, flowers
    drawGuestRoom(ctx, w, h, s, bg) {
        // Elegant curtains
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(w - 80 * s, 20 * s, 60 * s, h - 80 * s);
        ctx.fillRect(20 * s, 20 * s, 60 * s, h - 80 * s);
        // Flower vase
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(w * 0.5 - 15 * s, h - 120 * s, 30 * s, 80 * s);
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(w * 0.5, h - 130 * s, 20 * s, 0, Math.PI * 2);
        ctx.arc(w * 0.5 - 15 * s, h - 145 * s, 15 * s, 0, Math.PI * 2);
        ctx.arc(w * 0.5 + 15 * s, h - 145 * s, 15 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Study Night - Lamp glow, dark room
    drawStudyNight(ctx, w, h, s, bg) {
        // Desk lamp glow
        const gradient = ctx.createRadialGradient(150 * s, h - 150 * s, 0, 150 * s, h - 150 * s, 200 * s);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, h - 350 * s, 350 * s, 350 * s);
        // Lamp
        ctx.fillStyle = '#333';
        ctx.fillRect(130 * s, h - 200 * s, 10 * s, 160 * s);
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(100 * s, h - 200 * s);
        ctx.lineTo(135 * s, h - 250 * s);
        ctx.lineTo(170 * s, h - 200 * s);
        ctx.fill();
        // Books stacked
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(w - 120 * s, h - 80 * s, 50 * s, 15 * s);
        ctx.fillStyle = '#00008B';
        ctx.fillRect(w - 115 * s, h - 95 * s, 45 * s, 15 * s);
    }
    
    // Bedroom Dark - Very dark, moonlight
    drawBedroomDark(ctx, w, h, s, bg) {
        // Moonlight through window
        const gradient = ctx.createLinearGradient(w - 100 * s, 0, w - 100 * s, h);
        gradient.addColorStop(0, 'rgba(65, 105, 225, 0.2)');
        gradient.addColorStop(1, 'rgba(65, 105, 225, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(w - 200 * s, 0, 200 * s, h);
        // Window frame
        ctx.strokeStyle = '#4169E1';
        ctx.lineWidth = 5 * s;
        ctx.strokeRect(w - 150 * s, 30 * s, 100 * s, 120 * s);
        // Bed silhouette
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(w - 350 * s, h - 100 * s, 200 * s, 60 * s);
    }
    
    // Messy Room - Scattered items
    drawMessyRoom(ctx, w, h, s, bg) {
        // Scattered clothes
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.ellipse(100 * s, h - 60 * s, 30 * s, 15 * s, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.ellipse(w * 0.4, h - 55 * s, 25 * s, 12 * s, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Toys scattered
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(200 * s, h - 70 * s, 20 * s, 20 * s);
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.arc(280 * s, h - 55 * s, 12 * s, 0, Math.PI * 2);
        ctx.fill();
        // Poster tilted
        ctx.save();
        ctx.translate(w - 150 * s, 80 * s);
        ctx.rotate(0.1);
        ctx.fillStyle = '#BA55D3';
        ctx.fillRect(-40 * s, -30 * s, 80 * s, 60 * s);
        ctx.restore();
    }
    
    // Living Cozy - Warm lighting
    drawLivingCozy(ctx, w, h, s, bg) {
        // Warm ambient light
        const gradient = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w * 0.3, h * 0.4, h * 0.6);
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        // Sofa
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(50 * s, h - 120 * s, 150 * s, 80 * s);
        // Remote on sofa
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(100 * s, h - 100 * s, 30 * s, 10 * s);
        // TV
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(w - 160 * s, h - 200 * s, 130 * s, 80 * s);
    }
    
    // Bedroom Morning - Bright, fresh
    drawBedroomMorning(ctx, w, h, s, bg) {
        // Window with sunlight
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(w - 150 * s, 30 * s, 120 * s, 100 * s);
        // Sun rays
        const gradient = ctx.createLinearGradient(w - 90 * s, 50 * s, w * 0.3, h);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        // Bed
        ctx.fillStyle = '#4682B4';
        ctx.fillRect(w - 350 * s, h - 100 * s, 200 * s, 60 * s);
        // Wet towel hint
        ctx.fillStyle = '#fff';
        ctx.save();
        ctx.translate(w - 280 * s, h - 90 * s);
        ctx.rotate(-0.1);
        ctx.fillRect(0, 0, 60 * s, 20 * s);
        ctx.restore();
    }
    
    // Study Tense - Red tint, pressure
    drawStudyTense(ctx, w, h, s, bg) {
        // Red warning overlay
        const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.6);
        gradient.addColorStop(0, 'rgba(139, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        // Report card on wall
        ctx.fillStyle = '#fff';
        ctx.fillRect(w - 120 * s, 60 * s, 80 * s, 100 * s);
        ctx.fillStyle = '#B22222';
        ctx.font = `bold ${20 * s}px sans-serif`;
        ctx.fillText('F', w - 85 * s, 120 * s);
    }
    
    // Dining Green - Vegetable theme
    drawDiningGreen(ctx, w, h, s, bg) {
        // Dining table
        ctx.fillStyle = '#2E8B57';
        ctx.fillRect(w * 0.35, h - 120 * s, 220 * s, 15 * s);
        // Vegetables on plate
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h - 130 * s, 40 * s, 15 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        // Karela (bitter gourd)
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h - 135 * s, 25 * s, 8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        // Decorative plants
        ctx.fillStyle = '#006400';
        ctx.beginPath();
        ctx.arc(100 * s, h - 150 * s, 50 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Kitchen Blue - Water bottles theme
    drawKitchenBlue(ctx, w, h, s, bg) {
        // Kitchen counter
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(w - 280 * s, h - 140 * s, 260 * s, 100 * s);
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(w - 280 * s, h - 140 * s, 260 * s, 10 * s);
        // Water bottles
        ctx.fillStyle = '#4682B4';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(w - 260 * s + i * 50 * s, h - 180 * s, 25 * s, 45 * s);
            ctx.beginPath();
            ctx.arc(w - 247 * s + i * 50 * s, h - 180 * s, 12 * s, Math.PI, 0);
            ctx.fill();
        }
        // Water dispenser
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(80 * s, h - 250 * s, 60 * s, 210 * s);
        ctx.fillStyle = '#4169E1';
        ctx.beginPath();
        ctx.arc(110 * s, h - 200 * s, 25 * s, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Living Cool - AC theme
    drawLivingCool(ctx, w, h, s, bg) {
        // AC unit on wall
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(w * 0.4, 40 * s, 150 * s, 50 * s);
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2 * s;
        ctx.strokeRect(w * 0.4, 40 * s, 150 * s, 50 * s);
        // AC vents
        ctx.fillStyle = '#ddd';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(w * 0.4 + 10 * s + i * 35 * s, 75 * s, 30 * s, 10 * s);
        }
        // Cool air effect
        ctx.strokeStyle = 'rgba(0, 206, 209, 0.3)';
        ctx.lineWidth = 2 * s;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(w * 0.4 + 20 * s + i * 30 * s, 95 * s);
            ctx.quadraticCurveTo(w * 0.4 + 35 * s + i * 30 * s, 130 * s, w * 0.4 + 20 * s + i * 30 * s, 160 * s);
            ctx.stroke();
        }
        // Money tree (sarcastic element)
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(100 * s, h - 120 * s, 40 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(90 * s, h - 80 * s, 20 * s, 40 * s);
    }
    
    // Angry Room - Intense, red
    drawAngryRoom(ctx, w, h, s, bg) {
        // Dramatic red overlay
        const gradient = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.5, w * 0.5);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.15)');
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        // Angry speech bubbles
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(w * 0.3, 100 * s, 40 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#DC143C';
        ctx.font = `bold ${30 * s}px sans-serif`;
        ctx.fillText('!', w * 0.3 - 8 * s, 110 * s);
    }
    
    // Boss Room - Epic, dramatic
    drawBossRoom(ctx, w, h, s, bg) {
        // Dramatic lighting
        const gradient = ctx.createRadialGradient(w * 0.7, h - 100 * s, 0, w * 0.7, h - 100 * s, 300 * s);
        gradient.addColorStop(0, 'rgba(255, 69, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        // Door frame (Dad entering)
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(w - 150 * s, 50 * s, 120 * s, h - 100 * s);
        ctx.fillStyle = '#1a0a0a';
        ctx.fillRect(w - 140 * s, 60 * s, 100 * s, h - 120 * s);
        // Ominous shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.moveTo(w - 90 * s, h - 60 * s);
        ctx.lineTo(w - 140 * s, 100 * s);
        ctx.lineTo(w - 40 * s, 100 * s);
        ctx.lineTo(w - 90 * s, h - 60 * s);
        ctx.fill();
        // "Dad" silhouette in door
        ctx.fillStyle = '#0a0505';
        ctx.beginPath();
        ctx.arc(w - 90 * s, 150 * s, 35 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(w - 120 * s, 180 * s, 60 * s, 150 * s);
    }

    // ========================================
    // DRAW HELPERS
    // ========================================
    drawRoundedRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2; 
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath(); 
        this.ctx.moveTo(x + r, y); 
        this.ctx.arcTo(x + w, y, x + w, y + h, r);
        this.ctx.arcTo(x + w, y + h, x, y + h, r); 
        this.ctx.arcTo(x, y + h, x, y, r); 
        this.ctx.arcTo(x, y, x + w, y, r); 
        this.ctx.closePath();
    }

    drawKid(radius) {
        this.ctx.fillStyle = '#FFCCBC'; 
        this.ctx.beginPath(); 
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.lineWidth = 2; 
        this.ctx.strokeStyle = '#E64A19'; 
        this.ctx.stroke();
        this.ctx.fillStyle = 'black'; 
        this.ctx.beginPath(); 
        this.ctx.arc(0, -radius * 0.2, radius - 1, Math.PI, 2 * Math.PI); 
        this.ctx.fill();
        this.ctx.beginPath(); 
        this.ctx.moveTo(-10, -radius); 
        this.ctx.lineTo(-5, -radius * 1.4); 
        this.ctx.lineTo(0, -radius); 
        this.ctx.moveTo(0, -radius); 
        this.ctx.lineTo(5, -radius * 1.4); 
        this.ctx.lineTo(10, -radius); 
        this.ctx.fill();
        this.ctx.fillStyle = 'white'; 
        this.ctx.beginPath(); 
        this.ctx.arc(-radius * 0.3, -2, radius * 0.3, 0, Math.PI * 2); 
        this.ctx.arc(radius * 0.3, -2, radius * 0.3, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = 'black'; 
        this.ctx.beginPath(); 
        this.ctx.arc(-radius * 0.3, -2, radius * 0.1, 0, Math.PI * 2); 
        this.ctx.arc(radius * 0.3, -2, radius * 0.1, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = '#3E2723'; 
        this.ctx.beginPath(); 
        this.ctx.ellipse(0, radius * 0.4, radius * 0.15, radius * 0.25, 0, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = '#1E88E5'; 
        this.ctx.save(); 
        this.ctx.translate(-radius * 0.3, radius * 0.8); 
        this.ctx.rotate(0.2); 
        this.ctx.fillRect(-radius * 0.15, 0, radius * 0.3, radius * 0.6); 
        this.ctx.fillStyle = 'black'; 
        this.ctx.fillRect(-radius * 0.15, radius * 0.6, radius * 0.35, radius * 0.2); 
        this.ctx.restore();
        this.ctx.fillStyle = '#1E88E5'; 
        this.ctx.save(); 
        this.ctx.translate(radius * 0.3, radius * 0.8); 
        this.ctx.rotate(-0.2); 
        this.ctx.fillRect(-radius * 0.15, 0, radius * 0.3, radius * 0.6); 
        this.ctx.fillStyle = 'black'; 
        this.ctx.fillRect(-radius * 0.15, radius * 0.6, radius * 0.35, radius * 0.2); 
        this.ctx.restore();
    }

    drawChappal(w, h) {
        this.ctx.fillStyle = '#2962FF'; 
        this.drawRoundedRect(-w / 2, -h / 2, w, h, h * 0.4); 
        this.ctx.fill();
        this.ctx.strokeStyle = '#1038A6'; 
        this.ctx.lineWidth = 1; 
        this.ctx.stroke();
        this.ctx.strokeStyle = 'white'; 
        this.ctx.lineWidth = h * 0.2; 
        this.ctx.lineCap = 'round';
        this.ctx.beginPath(); 
        this.ctx.moveTo(-w * 0.2, 0); 
        this.ctx.lineTo(w * 0.1, -h / 2); 
        this.ctx.moveTo(-w * 0.2, 0); 
        this.ctx.lineTo(w * 0.1, h / 2); 
        this.ctx.stroke();
        this.ctx.fillStyle = '#2962FF'; 
        this.ctx.beginPath(); 
        this.ctx.arc(-w * 0.2, 0, h * 0.15, 0, Math.PI * 2); 
        this.ctx.fill();
    }

    drawBook(w, h) {
        this.ctx.fillStyle = '#1565C0'; 
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
        this.ctx.fillStyle = 'white'; 
        this.ctx.fillRect(-w / 2 + w * 0.08, -h / 2 + h * 0.04, w * 0.84, h * 0.1); 
        this.ctx.fillRect(-w / 2 + w * 0.08, h / 2 - h * 0.14, w * 0.84, h * 0.1);
        this.ctx.fillStyle = 'white'; 
        this.ctx.font = `bold ${w * 0.3}px Arial`; 
        this.ctx.fillText('MATH', -w * 0.4, h * 0.1);
    }

    drawWood(w, h) {
        this.ctx.fillStyle = '#8D6E63'; 
        this.ctx.fillRect(-w / 2, -h / 2, w, h);
        this.ctx.strokeStyle = '#5D4037'; 
        this.ctx.lineWidth = 2; 
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);
    }

    drawMummy(x, y, s) {
        this.ctx.save(); 
        this.ctx.translate(x, y); 
        this.ctx.scale(s, s); 
        const lx = 0, ly = 0;
        
        this.ctx.fillStyle = '#D9A688';
        this.ctx.save(); 
        this.ctx.translate(-15, 60); 
        this.drawRoundedRect(0, 0, 12, 18, 5); 
        this.ctx.fill(); 
        this.ctx.strokeStyle = '#2962FF'; 
        this.ctx.lineWidth = 2; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(0, 5); 
        this.ctx.lineTo(12, 5); 
        this.ctx.stroke(); 
        this.ctx.restore();
        
        this.ctx.save(); 
        this.ctx.translate(5, 60); 
        this.drawRoundedRect(0, 0, 12, 18, 5); 
        this.ctx.fill(); 
        this.ctx.strokeStyle = '#2962FF'; 
        this.ctx.lineWidth = 2; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(0, 5); 
        this.ctx.lineTo(12, 5); 
        this.ctx.stroke(); 
        this.ctx.restore();
        
        this.ctx.fillStyle = '#212121'; 
        this.ctx.beginPath(); 
        this.ctx.arc(lx - 25, ly - 55, 14, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = '#D81B60'; 
        this.ctx.beginPath(); 
        this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = '#AD1457'; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(lx - 10, ly - 40); 
        this.ctx.quadraticCurveTo(lx + 20, ly - 20, lx + 35, ly + 20); 
        this.ctx.lineTo(lx + 10, ly + 20); 
        this.ctx.lineTo(lx - 10, ly - 40); 
        this.ctx.fill();
        
        this.ctx.save(); 
        this.ctx.fillStyle = '#3E2723'; 
        this.drawRoundedRect(lx - 36, ly - 10, 72, 20, 10); 
        this.ctx.fill();
        let beltAmmo = (!this.isReloading && this.ammo > 0) ? Math.min(this.ammo - 1, 5) : Math.min(this.ammo, 5);
        for (let i = 0; i < beltAmmo; i++) {
            this.ctx.save(); 
            this.ctx.translate(-28 + (i * 14), -5 + Math.sin((i / 4) * Math.PI) * 5); 
            this.ctx.rotate(-0.2 + (i / 4) * 0.4);
            this.ctx.scale(0.4, 0.4); 
            this.ctx.fillStyle = '#2962FF'; 
            this.drawRoundedRect(-25, -10, 50, 20, 8); 
            this.ctx.fill();
            this.ctx.strokeStyle = 'white'; 
            this.ctx.lineWidth = 4; 
            this.ctx.lineCap = 'round'; 
            this.ctx.beginPath(); 
            this.ctx.moveTo(-10, 0); 
            this.ctx.lineTo(5, -10); 
            this.ctx.moveTo(-10, 0); 
            this.ctx.lineTo(5, 10); 
            this.ctx.stroke(); 
            this.ctx.fillStyle = '#2962FF'; 
            this.ctx.beginPath(); 
            this.ctx.arc(-10, 0, 3, 0, Math.PI * 2); 
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.restore();
        
        this.ctx.save(); 
        this.ctx.translate(lx, ly - 60); 
        this.ctx.fillStyle = '#D9A688'; 
        this.ctx.fillRect(-8, 10, 16, 10);
        this.ctx.beginPath(); 
        this.ctx.arc(0, 0, 22, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = '#212121'; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(-22, 0); 
        this.ctx.quadraticCurveTo(0, -25, 22, 0); 
        this.ctx.lineTo(22, -5); 
        this.ctx.quadraticCurveTo(0, -30, -22, -5); 
        this.ctx.fill();
        this.ctx.beginPath(); 
        this.ctx.arc(0, 0, 22, Math.PI, 0); 
        this.ctx.fill();
        this.ctx.fillStyle = 'white'; 
        this.ctx.beginPath(); 
        this.ctx.ellipse(-8, 2, 6, 4, 0, 0, Math.PI * 2); 
        this.ctx.ellipse(8, 2, 6, 4, 0, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.fillStyle = 'black'; 
        this.ctx.beginPath(); 
        this.ctx.arc(-7, 2, 2, 0, Math.PI * 2); 
        this.ctx.arc(9, 2, 2, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.lineWidth = 2.5; 
        this.ctx.strokeStyle = '#212121'; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(-14, -2); 
        this.ctx.lineTo(-4, 0); 
        this.ctx.stroke(); 
        this.ctx.beginPath(); 
        this.ctx.moveTo(4, 0); 
        this.ctx.lineTo(14, -2); 
        this.ctx.stroke();
        this.ctx.fillStyle = '#D50000'; 
        this.ctx.beginPath(); 
        this.ctx.arc(0, -6, 3, 0, Math.PI * 2); 
        this.ctx.fill();
        this.ctx.restore(); 
        this.ctx.restore();
        
        const shoulderX = x + (15 * s); 
        const shoulderY = y - (35 * s);
        let hx, hy; 
        if (this.isAiming && this.chappal) { 
            hx = this.chappal.position.x; 
            hy = this.chappal.position.y; 
        } else { 
            hx = x + (10 * s); 
            hy = y; 
        }
        
        const ex = (shoulderX + hx) / 2; 
        const ey = (shoulderY + hy) / 2 + (15 * s);
        this.ctx.strokeStyle = '#D9A688'; 
        this.ctx.lineWidth = 12 * s; 
        this.ctx.lineCap = 'round'; 
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath(); 
        this.ctx.moveTo(shoulderX, shoulderY); 
        this.ctx.quadraticCurveTo(ex, ey, hx, hy); 
        this.ctx.stroke();
        this.ctx.strokeStyle = '#FFD700'; 
        this.ctx.lineWidth = 4 * s; 
        this.ctx.beginPath(); 
        this.ctx.moveTo(hx - (5 * s), hy - (5 * s)); 
        this.ctx.lineTo(hx + (5 * s), hy + (5 * s)); 
        this.ctx.stroke();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ========================================
// INITIALIZE GAME
// ========================================
const game = new Game();
