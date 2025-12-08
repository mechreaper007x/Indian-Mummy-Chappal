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
// REGIONAL MUMMY TYPES - Different styles from across India
// ========================================
const MUMMY_TYPES = [
    { 
        id: 'punjabi', 
        name: 'Punjabi Mummy', 
        region: 'Punjab', 
        sareeColor: '#D81B60', 
        accentColor: '#AD1457', 
        bindiColor: '#FFD700', 
        skinTone: '#E8B89D',
        hairAccessory: 'paranda', // Colorful hair extension
        specialFeature: 'heavy_jewelry'
    },
    { 
        id: 'tamil', 
        name: 'Tamil Amma', 
        region: 'Tamil Nadu', 
        sareeColor: '#1E88E5', 
        accentColor: '#1565C0', 
        bindiColor: '#D50000', 
        skinTone: '#C68642',
        hairAccessory: 'jasmine_garland',
        specialFeature: 'nose_stud'
    },
    { 
        id: 'bengali', 
        name: 'Bengali Maa', 
        region: 'Bengal', 
        sareeColor: '#FFFFFF', 
        accentColor: '#D50000', 
        bindiColor: '#D50000', 
        skinTone: '#DEBA9D',
        hairAccessory: 'shakha_pola', // White & red bangles
        specialFeature: 'sindoor_line'
    },
    { 
        id: 'gujarati', 
        name: 'Gujarati Ba', 
        region: 'Gujarat', 
        sareeColor: '#FF9800', 
        accentColor: '#F57C00', 
        bindiColor: '#4CAF50', 
        skinTone: '#E0C4A8',
        hairAccessory: 'ghunghat',
        specialFeature: 'mirror_work'
    },
    { 
        id: 'marathi', 
        name: 'Marathi Aai', 
        region: 'Maharashtra', 
        sareeColor: '#4CAF50', 
        accentColor: '#388E3C', 
        bindiColor: '#D50000', 
        skinTone: '#D9A688',
        hairAccessory: 'gajra',
        specialFeature: 'nath' // Nose ring
    },
    { 
        id: 'malayali', 
        name: 'Malayali Amma', 
        region: 'Kerala', 
        sareeColor: '#FFD54F', 
        accentColor: '#8D6E63', 
        bindiColor: '#000000', 
        skinTone: '#C68642',
        hairAccessory: 'mundu_kasavu',
        specialFeature: 'gold_jewelry'
    },
    { 
        id: 'rajasthani', 
        name: 'Rajasthani Maa', 
        region: 'Rajasthan', 
        sareeColor: '#E91E63', 
        accentColor: '#C2185B', 
        bindiColor: '#FFD700', 
        skinTone: '#E8B89D',
        hairAccessory: 'borla', // Head jewelry
        specialFeature: 'ghunghat_heavy'
    },
    { 
        id: 'bihari', 
        name: 'Bihari Maiya', 
        region: 'Bihar', 
        sareeColor: '#9C27B0', 
        accentColor: '#7B1FA2', 
        bindiColor: '#D50000', 
        skinTone: '#D9A688',
        hairAccessory: 'sindoor_heavy',
        specialFeature: 'maang_tikka'
    }
];

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

    // ============================================
    // FUNNY INDIAN TV SOUND EFFECTS
    // ============================================

    // Dramatic Sting - "Dhan Dhan Dhan!" Indian TV serial style
    playDramaticSting() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Three dramatic hits with reverb effect
        const notes = [196, 196, 130.81]; // G3, G3, C3 - dramatic drop
        const delays = [0, 0.15, 0.3];
        const durations = [0.12, 0.12, 0.4];
        
        delays.forEach((delay, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = notes[i];
            
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.3, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, now + delay + durations[i]);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + durations[i]);
        });
    }

    // Mummy Angry Sound - Rising tension + angry grunt
    playMummyAngry() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Tension riser
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
        
        // Angry "ARGH!" formant
        const vowel = ctx.createOscillator();
        vowel.type = 'sawtooth';
        vowel.frequency.value = 180;
        
        const formant1 = ctx.createBiquadFilter();
        formant1.type = 'bandpass';
        formant1.frequency.value = 800;
        formant1.Q.value = 8;
        
        const vGain = ctx.createGain();
        vGain.gain.setValueAtTime(0, now + 0.25);
        vGain.gain.linearRampToValueAtTime(0.25, now + 0.3);
        vGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        vowel.connect(formant1);
        formant1.connect(vGain);
        vGain.connect(ctx.destination);
        vowel.start(now + 0.25);
        vowel.stop(now + 0.5);
    }

    // Kid Taunt Sound - Nah nah nah!
    playKidTaunt() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Mocking "nah nah" melody
        const notes = [392, 330, 392, 330, 262]; // G4 E4 G4 E4 C4
        const durations = [0.1, 0.1, 0.1, 0.1, 0.2];
        let time = now;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + durations[i]);
            
            time += durations[i] * 0.8;
        });
    }

    // Laugh Track - Sitcom style haha
    playLaughTrack() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // Multiple random "ha ha" sounds overlapping
        for (let j = 0; j < 3; j++) {
            const startDelay = j * 0.1;
            const baseFreq = 200 + Math.random() * 100;
            
            for (let i = 0; i < 4; i++) {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = baseFreq + (i % 2) * 50;
                
                const gain = ctx.createGain();
                const t = now + startDelay + i * 0.08;
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.06);
            }
        }
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
// LEVEL STORIES - Comic Intro for Each Level
// Regional dialogue variations based on selected mummy type
// ========================================
const REGIONAL_EXCLAMATIONS = {
    punjabi: { angry: 'Oye!', shock: 'Rabba!', threat: 'Khotey da puttar!', call: 'Beta ji!' },
    tamil: { angry: 'Aiyo!', shock: 'Amma!', threat: 'Poda!', call: 'Kanna!' },
    bengali: { angry: 'Ore baba!', shock: 'Ki holo!', threat: 'Shono!', call: 'Sona!' },
    gujarati: { angry: 'Arey!', shock: 'Hey Ram!', threat: 'Kem chho!', call: 'Dikra!' },
    marathi: { angry: 'Aai ga!', shock: 'Devach jane!', threat: 'Thamba!', call: 'Bala!' },
    malayali: { angry: 'Aiyyo!', shock: 'Daivame!', threat: 'Poda patti!', call: 'Mone!' },
    rajasthani: { angry: 'Arey re!', shock: 'Bhagwan!', threat: 'Ruk ja!', call: 'Chhora!' },
    bihari: { angry: 'Ae haaye!', shock: 'Ram Ram!', threat: 'Ruk!', call: 'Babua!' }
};

const LEVEL_STORIES = [
    // ============ LEVEL 1: Homework Pile ============
    {
        title: 'The Missing Homework',
        panels: [
            {
                scene: 'study_room',
                narration: 'Meanwhile, in the study room...',
                mummyExpression: 'stern',
                kidExpression: 'nervous',
                dialogue: { speaker: 'mummy', text: 'Beta, show me your Maths homework.' },
                kidPosition: 'hiding_behind_books'
            },
            {
                scene: 'books_pile',
                mummyExpression: 'suspicious',
                kidExpression: 'sweating',
                dialogue: { speaker: 'kid', text: 'Homework? What homework? I don\'t remember any...' },
                effect: 'sweat_drops'
            },
            {
                scene: 'dramatic_reveal',
                mummyExpression: 'angry',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'HIDING BEHIND BOOKS WON\'T SAVE YOU!' },
                effect: 'anger_lines',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 2: Sofa Fort ============
    {
        title: 'The Cushion Fortress',
        panels: [
            {
                scene: 'living_room',
                narration: 'One week before final exams...',
                mummyExpression: 'stern',
                kidExpression: 'mischievous',
                dialogue: { speaker: 'mummy', text: 'Why is the sofa destroyed?!' }
            },
            {
                scene: 'sofa_fort',
                mummyExpression: 'shocked',
                kidExpression: 'hiding',
                dialogue: { speaker: 'kid', text: 'It\'s not destroyed... it\'s a FORT!' },
                effect: 'fort_reveal'
            },
            {
                scene: 'tv_on',
                mummyExpression: 'furious',
                kidExpression: 'caught',
                dialogue: { speaker: 'mummy', text: 'NO TV UNTIL YOU TOP THE CLASS!' },
                effect: 'dramatic_zoom',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 3: Cricket Match ============
    {
        title: 'The Broken Window',
        panels: [
            {
                scene: 'outdoor',
                narration: 'Earlier that afternoon...',
                mummyExpression: 'neutral',
                kidExpression: 'playing',
                dialogue: { speaker: 'kid', text: 'SIXER! I hit a SIXER!' },
                effect: 'cricket_ball_flying'
            },
            {
                scene: 'crash_sound',
                narration: '*CRASH*',
                mummyExpression: 'shocked',
                kidExpression: 'frozen',
                effect: 'glass_breaking'
            },
            {
                scene: 'window_broken',
                mummyExpression: 'investigating',
                kidExpression: 'hiding',
                dialogue: { speaker: 'mummy', text: 'WHO THREW THAT BALL?!' },
                effect: 'anger_lines'
            },
            {
                scene: 'confrontation',
                mummyExpression: 'rage',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'That window cost 5000 rupees!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 4: Kitchen Raid ============
    {
        title: 'The Gulab Jamun Heist',
        panels: [
            {
                scene: 'kitchen_night',
                narration: 'Late at night... the fridge light glows...',
                mummyExpression: 'sleeping',
                kidExpression: 'sneaking',
                effect: 'tiptoe'
            },
            {
                scene: 'gulab_jamun_box',
                kidExpression: 'excited',
                dialogue: { speaker: 'kid', text: 'Just one... okay maybe two...' },
                effect: 'drooling'
            },
            {
                scene: 'lights_on',
                mummyExpression: 'caught_you',
                kidExpression: 'frozen',
                dialogue: { speaker: 'mummy', text: 'THOSE ARE FOR GUESTS TOMORROW!' },
                effect: 'spotlight'
            },
            {
                scene: 'chase',
                mummyExpression: 'rage',
                kidExpression: 'running',
                dialogue: { speaker: 'mummy', text: 'You ate FIVE of them?!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 5: Phone Addiction ============
    {
        title: 'Screen Time Exceeded',
        panels: [
            {
                scene: 'bedroom_dark',
                narration: 'At 11:30 PM...',
                mummyExpression: 'suspicious',
                kidExpression: 'phone_glow',
                dialogue: { speaker: 'mummy', text: 'Is that a light under the blanket?' }
            },
            {
                scene: 'blanket_pulled',
                mummyExpression: 'angry',
                kidExpression: 'caught',
                dialogue: { speaker: 'kid', text: 'I was just checking the time!' },
                effect: 'phone_reveal'
            },
            {
                scene: 'phone_confiscated',
                mummyExpression: 'furious',
                kidExpression: 'pleading',
                dialogue: { speaker: 'mummy', text: 'You\'ll go BLIND staring at that screen!' },
                effect: 'anger_lines',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 6: Forgot Tiffin ============
    {
        title: 'The Empty Stomach',
        panels: [
            {
                scene: 'dining_room',
                narration: 'Morning chaos...',
                mummyExpression: 'packing',
                kidExpression: 'rushing',
                dialogue: { speaker: 'mummy', text: 'Don\'t forget your tiffin!' }
            },
            {
                scene: 'school_gate',
                mummyExpression: 'shocked',
                narration: '2 hours later...',
                dialogue: { speaker: 'kid', text: '(hungry noises)' },
                effect: 'tiffin_on_table'
            },
            {
                scene: 'angry_call',
                mummyExpression: 'furious',
                kidExpression: 'apologetic',
                dialogue: { speaker: 'mummy', text: 'How will you SURVIVE?! What will people think?!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 7: Broken Vase ============
    {
        title: 'Nani\'s Gift',
        panels: [
            {
                scene: 'drawing_room',
                narration: 'During a game of catch...',
                kidExpression: 'playing',
                effect: 'ball_trajectory'
            },
            {
                scene: 'vase_falling',
                narration: '...everything went slow motion...',
                effect: 'slow_motion',
                mummyExpression: 'shock'
            },
            {
                scene: 'vase_shattered',
                mummyExpression: 'heartbroken',
                kidExpression: 'guilty',
                dialogue: { speaker: 'mummy', text: 'YOUR NANI GAVE US THAT! It was 40 years old!' },
                effect: 'tear_drop'
            },
            {
                scene: 'consequences',
                mummyExpression: 'rage',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'Do you know its SENTIMENTAL VALUE?!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 8: Sibling Fight ============
    {
        title: 'Blood is Not Thicker',
        panels: [
            {
                scene: 'kids_room',
                narration: 'The daily ritual...',
                kidExpression: 'fighting',
                dialogue: { speaker: 'kid', text: 'That\'s MY toy!' }
            },
            {
                scene: 'crying',
                mummyExpression: 'tired',
                kidExpression: 'crying',
                dialogue: { speaker: 'kid2', text: 'MUMMY! He hit me!' },
                effect: 'tears'
            },
            {
                scene: 'mummy_arrives',
                mummyExpression: 'furious',
                kidExpression: 'pointing',
                dialogue: { speaker: 'mummy', text: 'STOP HITTING YOUR BHAI!' },
                effect: 'anger_lines'
            },
            {
                scene: 'both_punished',
                mummyExpression: 'rage',
                kidExpression: 'united_fear',
                dialogue: { speaker: 'mummy', text: 'BOTH of you will get it now!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 9: Relatives Visit ============
    {
        title: 'Namaste Aunty',
        panels: [
            {
                scene: 'doorbell',
                narration: 'The doorbell of doom...',
                mummyExpression: 'excited',
                kidExpression: 'dread',
                dialogue: { speaker: 'mummy', text: 'Sharma Aunty is here! Come say hello!' }
            },
            {
                scene: 'hiding_spot',
                mummyExpression: 'searching',
                kidExpression: 'hiding',
                dialogue: { speaker: 'kid', text: '(under the bed, not breathing)' },
                effect: 'hiding'
            },
            {
                scene: 'found',
                mummyExpression: 'angry',
                kidExpression: 'caught',
                dialogue: { speaker: 'mummy', text: 'I can see your FEET!' },
                effect: 'spotlight'
            },
            {
                scene: 'dragged_out',
                mummyExpression: 'forced_smile',
                kidExpression: 'embarrassed',
                dialogue: { speaker: 'mummy', text: 'Go touch their FEET! Show some RESPECT!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 10: Exam Tomorrow ============
    {
        title: 'Last Minute Panic',
        panels: [
            {
                scene: 'calendar',
                narration: 'The night before the exam...',
                effect: 'red_circle_tomorrow'
            },
            {
                scene: 'study_night',
                mummyExpression: 'suspicious',
                kidExpression: 'panicking',
                dialogue: { speaker: 'mummy', text: 'Why are you studying NOW?' }
            },
            {
                scene: 'books_everywhere',
                mummyExpression: 'realizing',
                kidExpression: 'guilty',
                dialogue: { speaker: 'mummy', text: 'You had THREE MONTHS for this!' },
                effect: 'anger_rising'
            },
            {
                scene: 'rage_mode',
                mummyExpression: 'ultimate_rage',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'I told you EVERY DAY to study!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 11: Late Night ============
    {
        title: 'The 2 AM Raid',
        panels: [
            {
                scene: 'bedroom_2am',
                narration: 'At 2:00 AM...',
                mummyExpression: 'sleeping',
                kidExpression: 'phone_glow',
                effect: 'clock_ticking'
            },
            {
                scene: 'door_opens',
                mummyExpression: 'suspicious',
                kidExpression: 'pretending_sleep',
                dialogue: { speaker: 'mummy', text: 'I can see the PHONE GLOW under your blanket!' }
            },
            {
                scene: 'busted',
                mummyExpression: 'furious',
                kidExpression: 'caught',
                dialogue: { speaker: 'mummy', text: 'You have SCHOOL tomorrow!' },
                effect: 'dramatic_lighting',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 12: Messy Room ============
    {
        title: 'The Disaster Zone',
        panels: [
            {
                scene: 'messy_room_door',
                mummyExpression: 'opening_door',
                narration: 'Mummy opens the door...',
                effect: 'horror_music'
            },
            {
                scene: 'chaos_revealed',
                mummyExpression: 'shock',
                narration: 'Clothes everywhere. Books on floor. Chips packets. Chaos.',
                effect: 'mess_explosion'
            },
            {
                scene: 'maid_not',
                mummyExpression: 'rage',
                kidExpression: 'unbothered',
                dialogue: { speaker: 'mummy', text: 'I am NOT your MAID!' },
                effect: 'anger_lines'
            },
            {
                scene: 'deadline',
                mummyExpression: 'ultimatum',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'Clean this RIGHT NOW or face the chappal!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 13: Lost Remote ============
    {
        title: 'The Vanishing Remote',
        panels: [
            {
                scene: 'living_room_search',
                mummyExpression: 'searching',
                kidExpression: 'innocent',
                dialogue: { speaker: 'mummy', text: 'Where is the TV remote?' }
            },
            {
                scene: 'checking_everywhere',
                mummyExpression: 'frustrated',
                kidExpression: 'nervous',
                dialogue: { speaker: 'kid', text: 'I don\'t know, I didn\'t touch it!' },
                effect: 'searching'
            },
            {
                scene: 'accusation',
                mummyExpression: 'suspicious',
                kidExpression: 'sweating',
                dialogue: { speaker: 'mummy', text: 'Check under your BUNS!' },
                effect: 'detective_mode'
            },
            {
                scene: 'found_under_kid',
                mummyExpression: 'rage',
                kidExpression: 'guilty',
                dialogue: { speaker: 'mummy', text: 'You were SITTING on it?!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 14: Wet Towel ============
    {
        title: 'The Bed Crime',
        panels: [
            {
                scene: 'bedroom_morning',
                mummyExpression: 'entering',
                kidExpression: 'leaving',
                dialogue: { speaker: 'mummy', text: 'Did you take a bath?' }
            },
            {
                scene: 'bed_check',
                mummyExpression: 'investigating',
                narration: 'She touches the bed...',
                effect: 'wet_spot'
            },
            {
                scene: 'towel_found',
                mummyExpression: 'rage',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'WET TOWEL ON THE BED?!' },
                effect: 'anger_explosion'
            },
            {
                scene: 'hotel_comparison',
                mummyExpression: 'furious',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'THIS IS NOT A FIVE-STAR HOTEL!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 15: Bad Report Card ============
    {
        title: 'Only 98%?',
        panels: [
            {
                scene: 'report_card_day',
                narration: 'Result day...',
                mummyExpression: 'expectant',
                kidExpression: 'proud',
                dialogue: { speaker: 'kid', text: 'Mummy! I got 98%!' }
            },
            {
                scene: 'reading_card',
                mummyExpression: 'examining',
                kidExpression: 'hopeful',
                dialogue: { speaker: 'mummy', text: 'Hmm... 98... 98...' }
            },
            {
                scene: 'sharma_comparison',
                mummyExpression: 'disappointed',
                kidExpression: 'sinking',
                dialogue: { speaker: 'mummy', text: 'Sharma ji\'s son got 99%!' },
                effect: 'sharma_kid_image'
            },
            {
                scene: 'failure',
                mummyExpression: 'angry',
                kidExpression: 'crying',
                dialogue: { speaker: 'mummy', text: 'Where did 2 marks GO?! You FAILED us!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 16: Vegetables ============
    {
        title: 'The Karela War',
        panels: [
            {
                scene: 'dining_table',
                mummyExpression: 'serving',
                kidExpression: 'disgust',
                dialogue: { speaker: 'mummy', text: 'Eat your vegetables!' }
            },
            {
                scene: 'plate_rejection',
                mummyExpression: 'stern',
                kidExpression: 'refusing',
                dialogue: { speaker: 'kid', text: 'I don\'t like Karela! It\'s BITTER!' },
                effect: 'yuck_face'
            },
            {
                scene: 'health_lecture',
                mummyExpression: 'lecturing',
                kidExpression: 'bored',
                dialogue: { speaker: 'mummy', text: 'It\'s GOOD for you! Clears blood pressure!' }
            },
            {
                scene: 'ultimatum',
                mummyExpression: 'rage',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'EAT or there\'s NO DINNER!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 17: Empty Water Bottles ============
    {
        title: 'The Dehydration Crisis',
        panels: [
            {
                scene: 'kitchen',
                mummyExpression: 'discovering',
                narration: 'Mummy goes to the fridge...',
                effect: 'fridge_opening'
            },
            {
                scene: 'empty_bottles',
                mummyExpression: 'shock',
                narration: 'ALL bottles empty. ALL of them.',
                effect: 'empty_bottles_row'
            },
            {
                scene: 'who_did',
                mummyExpression: 'angry',
                kidExpression: 'hiding',
                dialogue: { speaker: 'mummy', text: 'Who DRANK all the water and didn\'t REFILL?!' },
                effect: 'investigation'
            },
            {
                scene: 'punishment',
                mummyExpression: 'rage',
                kidExpression: 'caught',
                dialogue: { speaker: 'mummy', text: 'You\'ll die of THIRST one day!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 18: AC On ============
    {
        title: 'The Electricity Bill',
        panels: [
            {
                scene: 'living_room_cold',
                mummyExpression: 'entering',
                kidExpression: 'chilling',
                dialogue: { speaker: 'kid', text: 'Ahhh... 16 degrees... perfect!' },
                effect: 'snowflakes'
            },
            {
                scene: 'bill_arrives',
                mummyExpression: 'shock',
                narration: 'The monthly bill arrives...',
                effect: 'bill_dramatic'
            },
            {
                scene: 'confrontation',
                mummyExpression: 'furious',
                kidExpression: 'sweating',
                dialogue: { speaker: 'mummy', text: '₹5000 bill?! Are we made of MONEY?!' },
                effect: 'bill_burning'
            },
            {
                scene: 'trees',
                mummyExpression: 'rage',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'Money doesn\'t GROW on TREES!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 19: Back Answer ============
    {
        title: 'The Unforgivable Sin',
        panels: [
            {
                scene: 'argument',
                mummyExpression: 'scolding',
                kidExpression: 'annoyed',
                dialogue: { speaker: 'mummy', text: 'How many times do I have to tell you?!' }
            },
            {
                scene: 'back_talk',
                mummyExpression: 'shocked',
                kidExpression: 'rebellious',
                dialogue: { speaker: 'kid', text: 'Whatever, I don\'t care...' },
                effect: 'record_scratch'
            },
            {
                scene: 'time_stops',
                mummyExpression: 'freeze_rage',
                narration: '...Time stopped. The air grew cold.',
                effect: 'dramatic_pause'
            },
            {
                scene: 'doom',
                mummyExpression: 'ultimate_rage',
                kidExpression: 'regret',
                dialogue: { speaker: 'mummy', text: 'REPEAT what you just SAID!' },
                effect: 'earthquake',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 20: THE FINAL BOSS ============
    {
        title: 'DAD IS COMING HOME',
        panels: [
            {
                scene: 'phone_rings',
                narration: 'The phone rings...',
                mummyExpression: 'answering',
                kidExpression: 'playing',
                effect: 'phone_ringing'
            },
            {
                scene: 'dads_voice',
                mummyExpression: 'grinning',
                kidExpression: 'nervous',
                dialogue: { speaker: 'phone', text: '"I\'ll be home in 10 minutes..."' },
                effect: 'ominous'
            },
            {
                scene: 'mummy_warning',
                mummyExpression: 'threatening',
                kidExpression: 'scared',
                dialogue: { speaker: 'mummy', text: 'Wait till your PAPA hears about today...' },
                effect: 'doom_clock'
            },
            {
                scene: 'kids_united',
                mummyExpression: 'calling',
                kidExpression: 'united_fear',
                dialogue: { speaker: 'mummy', text: 'ALL of you... COME HERE NOW!' },
                effect: 'boss_music'
            },
            {
                scene: 'final_stand',
                mummyExpression: 'ultimate_rage',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'Before Papa comes... I\'ll handle this MYSELF!' },
                effect: 'final_boss_aura',
                chappalReady: true
            }
        ]
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
        
        // Animation timers for living backgrounds
        this.animTime = 0;
        this.lastTime = Date.now();
        this.floatingElements = [];
        
        // Mummy expression state (happy when kid hit, sad when miss, angry when provoked)
        this.mummyExpression = 'neutral'; // 'neutral', 'happy', 'sad', 'angry'
        this.expressionTimer = 0;
        
        // Selected mummy type (regional variant)
        this.selectedMummyIdx = 0;
        
        // Kid provocation state - tracks when kids are taunting
        this.kidProvocationTimer = 0;
        this.kidsAreTaunting = false;

        // Comic storyline state
        this.comicActive = false;
        this.currentPanelIdx = 0;
        this.currentStory = null;

        this.initResize();
        this.setupCollisionEvents();
        this.setupMouse();
        this.initLevelGrid();
        this.setupFullscreenListener();
        this.initFloatingElements();
        
        // Start Loop
        this.loop();
    }

    initResize() {
        const ASPECT_RATIO = 16 / 9;
        
        this.handleResize = () => {
            const viewportWidth = document.documentElement.clientWidth;
            const viewportHeight = document.documentElement.clientHeight;
            
            // Calculate dimensions that fit 16:9 within available space
            let gameWidth, gameHeight;
            
            if (viewportWidth / viewportHeight > ASPECT_RATIO) {
                // Viewport is wider than 16:9 - fit to height (pillarbox)
                gameHeight = viewportHeight;
                gameWidth = gameHeight * ASPECT_RATIO;
            } else {
                // Viewport is taller than 16:9 - fit to width (letterbox)
                gameWidth = viewportWidth;
                gameHeight = gameWidth / ASPECT_RATIO;
            }
            
            // Set canvas size in pixels
            this.width = Math.floor(gameWidth);
            this.height = Math.floor(gameHeight);
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            
            // Center canvas via CSS
            this.canvas.style.position = 'absolute';
            this.canvas.style.left = `${(viewportWidth - this.width) / 2}px`;
            this.canvas.style.top = `${(viewportHeight - this.height) / 2}px`;
            this.canvas.style.width = `${this.width}px`;
            this.canvas.style.height = `${this.height}px`;
            
            // Calculate scale based on 16:9 reference (1920x1080)
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
        // Mobile orientation change
        window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 300));
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
                this.showComic(i); // Show comic intro before starting
            };
            grid.appendChild(btn);
        });
    }

    initMummyGrid() {
        const grid = document.getElementById('mummy-grid');
        if (!grid) return;
        grid.innerHTML = '';
        
        // SVG preview icons for each regional outfit
        const getOutfitPreview = (mummy) => {
            const skin = mummy.skinTone;
            const main = mummy.sareeColor;
            const accent = mummy.accentColor;
            const bindi = mummy.bindiColor;
            
            switch(mummy.id) {
                case 'punjabi':
                    // Salwar Kameez with Dupatta
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair -->
                        <path d="M18 15 Q30 0 42 15 L42 10 Q30 -5 18 10 Z" fill="#212121"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <!-- Kameez (long top) -->
                        <path d="M20 25 L15 55 L45 55 L40 25 Q30 30 20 25" fill="${main}"/>
                        <!-- Dupatta across shoulder -->
                        <path d="M18 25 Q50 30 48 55" stroke="${accent}" stroke-width="6" fill="none" opacity="0.8"/>
                        <!-- Salwar (pants) -->
                        <path d="M20 55 L18 78 L28 78 L30 55" fill="${accent}"/>
                        <path d="M40 55 L42 78 L32 78 L30 55" fill="${accent}"/>
                        <!-- Paranda in hair -->
                        <path d="M18 15 L12 35" stroke="#FF5722" stroke-width="2"/>
                        <circle cx="12" cy="38" r="3" fill="#FF5722"/>
                    </svg>`;
                    
                case 'tamil':
                    // Silk Saree with Gajra (jasmine flowers)
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair bun -->
                        <ellipse cx="22" cy="12" rx="8" ry="6" fill="#212121"/>
                        <!-- GAJRA - Jasmine flowers in hair -->
                        <circle cx="16" cy="8" r="2.5" fill="white" stroke="#eee" stroke-width="0.5"/>
                        <circle cx="20" cy="5" r="2.5" fill="white" stroke="#eee" stroke-width="0.5"/>
                        <circle cx="25" cy="4" r="2.5" fill="white" stroke="#eee" stroke-width="0.5"/>
                        <circle cx="30" cy="5" r="2.5" fill="white" stroke="#eee" stroke-width="0.5"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2.5" fill="${bindi}"/>
                        <!-- Saree body -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="${main}"/>
                        <!-- Gold zari border -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="none" stroke="#FFD700" stroke-width="2"/>
                        <!-- Pallu -->
                        <path d="M22 25 Q45 35 42 55" fill="${accent}"/>
                        <!-- Nose stud -->
                        <circle cx="32" cy="17" r="1" fill="#FFD700"/>
                    </svg>`;
                    
                case 'bengali':
                    // White Saree with Red Border (Laal Paar)
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair with sindoor line -->
                        <path d="M18 15 Q30 0 42 15 L42 8 Q30 -8 18 8 Z" fill="#212121"/>
                        <line x1="30" y1="3" x2="30" y2="10" stroke="#D50000" stroke-width="2"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="3" fill="${bindi}"/>
                        <!-- White saree base -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="#FFFFFF"/>
                        <!-- RED BORDER - signature Laal Paar -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="none" stroke="#D50000" stroke-width="4"/>
                        <!-- Red pallu -->
                        <path d="M22 25 Q45 35 42 55" fill="#D50000"/>
                        <!-- Shakha-Pola bangles (white & red) -->
                        <ellipse cx="12" cy="45" rx="4" ry="2" fill="white" stroke="#D50000" stroke-width="1"/>
                        <ellipse cx="12" cy="48" rx="4" ry="2" fill="#D50000"/>
                    </svg>`;
                    
                case 'gujarati':
                    // Chaniya Choli with Mirror Work
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair -->
                        <path d="M18 15 Q30 0 42 15 L42 8 Q30 -8 18 8 Z" fill="#212121"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <!-- Choli (blouse) -->
                        <ellipse cx="30" cy="30" rx="12" ry="8" fill="${accent}"/>
                        <!-- Ghagra (flared skirt) -->
                        <path d="M18 35 L8 78 L52 78 L42 35 Z" fill="${main}"/>
                        <!-- MIRROR WORK - white circles -->
                        <circle cx="20" cy="55" r="3" fill="white" opacity="0.9"/>
                        <circle cx="30" cy="60" r="3" fill="white" opacity="0.9"/>
                        <circle cx="40" cy="55" r="3" fill="white" opacity="0.9"/>
                        <circle cx="25" cy="70" r="3" fill="white" opacity="0.9"/>
                        <circle cx="35" cy="70" r="3" fill="white" opacity="0.9"/>
                        <!-- Odhni over head -->
                        <ellipse cx="30" cy="10" rx="18" ry="10" fill="${main}" opacity="0.5"/>
                    </svg>`;
                    
                case 'marathi':
                    // Nauvari (9-yard saree, kashta style)
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair with gajra -->
                        <ellipse cx="22" cy="12" rx="8" ry="6" fill="#212121"/>
                        <circle cx="16" cy="8" r="2" fill="white"/>
                        <circle cx="20" cy="6" r="2" fill="white"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <!-- NATH (big nose ring) - signature Marathi -->
                        <circle cx="30" cy="20" r="4" fill="none" stroke="#FFD700" stroke-width="1.5"/>
                        <circle cx="30" cy="24" r="1" fill="#FFD700"/>
                        <!-- Nauvari saree body -->
                        <ellipse cx="30" cy="48" rx="16" ry="26" fill="${main}"/>
                        <!-- Kashta drape (dhoti style between legs) -->
                        <path d="M28 50 L30 78 L32 50" fill="${accent}"/>
                        <!-- Pallu tucked at back -->
                        <path d="M15 30 Q12 45 15 55" stroke="${accent}" stroke-width="6" fill="none"/>
                    </svg>`;
                    
                case 'malayali':
                    // Kasavu Mundu (cream with gold border)
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Long hair -->
                        <path d="M18 15 Q30 0 42 15 L44 35 Q30 30 16 35 Z" fill="#212121"/>
                        <!-- Jasmine in hair -->
                        <circle cx="44" cy="30" r="2" fill="white"/>
                        <circle cx="44" cy="35" r="2" fill="white"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <!-- Cream Kasavu base -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="#FFFDD0"/>
                        <!-- GOLD KASAVU BORDER - double line -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="none" stroke="#FFD700" stroke-width="4"/>
                        <ellipse cx="30" cy="50" rx="15" ry="25" fill="none" stroke="#FFD700" stroke-width="1"/>
                        <!-- Heavy gold jewelry -->
                        <path d="M22 25 L38 25" stroke="#FFD700" stroke-width="3"/>
                        <circle cx="30" cy="28" r="3" fill="#FFD700"/>
                    </svg>`;
                    
                case 'rajasthani':
                    // Ghagra Choli with Heavy Ghunghat
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair -->
                        <path d="M18 15 Q30 0 42 15 L42 8 Q30 -8 18 8 Z" fill="#212121"/>
                        <!-- Borla (head jewelry) -->
                        <circle cx="30" cy="5" r="3" fill="#FFD700"/>
                        <path d="M30 8 L30 12" stroke="#FFD700" stroke-width="1"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <!-- Choli -->
                        <ellipse cx="30" cy="30" rx="14" ry="10" fill="${accent}"/>
                        <!-- Wide Ghagra (flared skirt) -->
                        <path d="M12 38 L2 78 L58 78 L48 38 Z" fill="${main}"/>
                        <!-- Embroidery circles -->
                        <circle cx="15" cy="60" r="4" fill="none" stroke="#FFD700" stroke-width="1"/>
                        <circle cx="30" cy="65" r="4" fill="none" stroke="#FFD700" stroke-width="1"/>
                        <circle cx="45" cy="60" r="4" fill="none" stroke="#FFD700" stroke-width="1"/>
                        <!-- HEAVY GHUNGHAT over head -->
                        <ellipse cx="28" cy="8" rx="22" ry="14" fill="${main}" opacity="0.7"/>
                    </svg>`;
                    
                case 'bihari':
                    // Traditional Saree with Heavy Sindoor & Maang Tikka
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <!-- Head -->
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <!-- Hair -->
                        <path d="M18 15 Q30 0 42 15 L42 8 Q30 -8 18 8 Z" fill="#212121"/>
                        <!-- HEAVY SINDOOR in maang -->
                        <path d="M30 0 L30 12" stroke="#D50000" stroke-width="4"/>
                        <!-- Maang Tikka -->
                        <circle cx="30" cy="5" r="2" fill="#FFD700"/>
                        <circle cx="30" cy="10" r="3" fill="#D50000" stroke="#FFD700" stroke-width="1"/>
                        <!-- Bindi -->
                        <circle cx="30" cy="14" r="2.5" fill="${bindi}"/>
                        <!-- Saree body -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="${main}"/>
                        <!-- Golden border -->
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="none" stroke="#DAA520" stroke-width="2"/>
                        <!-- Pallu -->
                        <path d="M22 25 Q45 35 42 55" fill="${accent}"/>
                    </svg>`;
                    
                default:
                    // Default saree
                    return `<svg viewBox="0 0 60 80" width="60" height="80">
                        <circle cx="30" cy="15" r="12" fill="${skin}" stroke="#333" stroke-width="1"/>
                        <circle cx="30" cy="12" r="2" fill="${bindi}"/>
                        <ellipse cx="30" cy="50" rx="18" ry="28" fill="${main}"/>
                        <path d="M22 25 Q45 35 42 55" fill="${accent}"/>
                    </svg>`;
            }
        };
        
        MUMMY_TYPES.forEach((mummy, i) => {
            const card = document.createElement('div');
            card.className = 'mummy-card' + (i === this.selectedMummyIdx ? ' selected' : '');
            card.innerHTML = `
                <div class="mummy-preview">
                    ${getOutfitPreview(mummy)}
                </div>
                <div class="mummy-name">${mummy.name}</div>
                <div class="mummy-region">${mummy.region}</div>
            `;
            card.onclick = () => {
                sounds.playClick();
                this.selectedMummyIdx = i;
                // Update selection visual
                document.querySelectorAll('.mummy-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                // Auto-proceed to level select after short delay
                setTimeout(() => {
                    this.showLevelSelect();
                }, 300);
            };
            grid.appendChild(card);
        });
    }

    // ========================================
    // UI FLOW
    // ========================================
    showStartScreen() {
        this.gameActive = false;
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('level-screen').classList.add('hidden');
        document.getElementById('mummy-screen').classList.add('hidden');
        document.getElementById('ui-layer').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('game-modal').classList.add('hidden');
    }

    showMummySelect() {
        sounds.playClick();
        this.initMummyGrid();
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('mummy-screen').classList.remove('hidden');
        document.getElementById('level-screen').classList.add('hidden');
    }

    showLevelSelect() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('mummy-screen').classList.add('hidden');
        document.getElementById('level-screen').classList.remove('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('comic-screen').classList.add('hidden');
    }

    // ========================================
    // COMIC STORYLINE SYSTEM
    // ========================================
    
    showComic(levelIdx) {
        sounds.init();
        this.comicActive = true;
        this.currentPanelIdx = 0;
        this.currentStory = LEVEL_STORIES[levelIdx];
        
        // Hide other screens
        document.getElementById('level-screen').classList.add('hidden');
        document.getElementById('comic-screen').classList.remove('hidden');
        
        // Set story title
        document.getElementById('comic-story-title').innerText = this.currentStory.title.toUpperCase();
        
        // Render first panel
        this.renderComicPanel();
    }
    
    advancePanel() {
        sounds.playClick();
        this.currentPanelIdx++;
        
        if (this.currentPanelIdx >= this.currentStory.panels.length) {
            // All panels shown, start the game
            this.skipComic();
        } else {
            // Re-animate the panel by forcing a re-render
            const panel = document.getElementById('comic-panel');
            panel.style.animation = 'none';
            panel.offsetHeight; // Trigger reflow
            panel.style.animation = 'panelSlideIn 0.4s ease-out';
            
            this.renderComicPanel();
        }
    }
    
    skipComic() {
        sounds.playClick();
        this.comicActive = false;
        document.getElementById('comic-screen').classList.add('hidden');
        this.startGame();
    }
    
    renderComicPanel() {
        const panel = this.currentStory.panels[this.currentPanelIdx];
        const totalPanels = this.currentStory.panels.length;
        
        // Update panel counter
        document.getElementById('panel-counter').innerText = `${this.currentPanelIdx + 1}/${totalPanels}`;
        
        // Get selected mummy type for regional dialogue
        const mummyType = MUMMY_TYPES[this.selectedMummyIdx];
        const regional = REGIONAL_EXCLAMATIONS[mummyType.id] || REGIONAL_EXCLAMATIONS.punjabi;
        
        // Handle narration
        const narrationBox = document.getElementById('comic-narration');
        if (panel.narration) {
            narrationBox.style.display = 'block';
            narrationBox.innerText = panel.narration;
        } else {
            narrationBox.style.display = 'none';
        }
        
        // Handle dialogue
        const dialogueBox = document.getElementById('comic-dialogue');
        if (panel.dialogue) {
            dialogueBox.style.display = 'block';
            
            // Apply regional prefix for mummy dialogue
            let text = panel.dialogue.text;
            if (panel.dialogue.speaker === 'mummy' && panel.mummyExpression === 'angry' || 
                panel.mummyExpression === 'rage' || panel.mummyExpression === 'furious') {
                // Add regional exclamation for angry mummy
                text = `${regional.angry} ${text}`;
            }
            
            dialogueBox.innerText = `"${text}"`;
            
            // Style based on speaker
            dialogueBox.classList.remove('kid-speech', 'angry-speech');
            if (panel.dialogue.speaker === 'kid' || panel.dialogue.speaker === 'kid2') {
                dialogueBox.classList.add('kid-speech');
            }
            if (panel.mummyExpression === 'angry' || panel.mummyExpression === 'rage' || 
                panel.mummyExpression === 'furious' || panel.mummyExpression === 'ultimate_rage') {
                dialogueBox.classList.add('angry-speech');
            }
        } else {
            dialogueBox.style.display = 'none';
        }
        
        // Handle effects
        const comicPanel = document.getElementById('comic-panel');
        
        // Remove existing effect overlays
        const existingEffects = comicPanel.querySelectorAll('.effect-anger, .effect-dramatic, .chappal-ready');
        existingEffects.forEach(el => el.remove());
        
        if (panel.effect === 'anger_lines' || panel.effect === 'anger_explosion' || panel.effect === 'earthquake') {
            const angerEffect = document.createElement('div');
            angerEffect.className = 'effect-anger';
            comicPanel.appendChild(angerEffect);
        }
        
        if (panel.effect === 'dramatic_zoom' || panel.effect === 'dramatic_pause' || 
            panel.effect === 'ominous' || panel.effect === 'final_boss_aura') {
            const dramaticEffect = document.createElement('div');
            dramaticEffect.className = 'effect-dramatic';
            comicPanel.appendChild(dramaticEffect);
        }
        
        if (panel.chappalReady) {
            const chappalIndicator = document.createElement('div');
            chappalIndicator.className = 'chappal-ready';
            chappalIndicator.innerText = '🩴 CHAPPAL READY!';
            comicPanel.appendChild(chappalIndicator);
        }
        
        // Update Next button text on last panel
        const nextBtn = document.getElementById('comic-next-btn');
        if (this.currentPanelIdx >= totalPanels - 1) {
            nextBtn.innerText = 'LET\'S GO! 🩴';
            nextBtn.style.background = '#4CAF50';
        } else {
            nextBtn.innerText = 'NEXT ▶';
            nextBtn.style.background = '#e64a19';
        }
        
        // Draw characters on canvas
        this.drawComicCharacters(panel);
    }
    
    drawComicCharacters(panel) {
        const canvas = document.getElementById('comic-canvas');
        const ctx = canvas.getContext('2d');
        const mummyType = MUMMY_TYPES[this.selectedMummyIdx];
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get background color based on level theme
        const bg = LEVEL_BACKGROUNDS[this.currentLevelIdx] || LEVEL_BACKGROUNDS[0];
        
        // Draw simple background
        ctx.fillStyle = bg.wallColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
        ctx.fillStyle = bg.floorColor;
        ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
        
        // Add some scene details based on level
        this.drawSceneDetails(ctx, canvas, this.currentLevelIdx);
        
        // Draw mummy (left side) - larger and more detailed
        if (panel.mummyExpression) {
            this.drawComicMummy(ctx, 130, 160, mummyType, panel.mummyExpression);
        }
        
        // Draw kid (right side) - larger and more detailed
        if (panel.kidExpression) {
            this.drawComicKid(ctx, 380, 170, panel.kidExpression);
        }
    }
    
    drawSceneDetails(ctx, canvas, levelIdx) {
        // Add simple scene props based on level theme
        ctx.globalAlpha = 0.3;
        
        // Window or frame
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(canvas.width - 80, 20, 50, 60);
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(canvas.width - 80, 20, 50, 60);
        ctx.beginPath();
        ctx.moveTo(canvas.width - 55, 20);
        ctx.lineTo(canvas.width - 55, 80);
        ctx.moveTo(canvas.width - 80, 50);
        ctx.lineTo(canvas.width - 30, 50);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
    
    drawComicMummy(ctx, x, y, mummyType, expression) {
        // Ground level is at y, character drawn upward
        const footY = y;
        
        // === LEGS ===
        ctx.fillStyle = mummyType.accentColor;
        // Left leg
        ctx.beginPath();
        ctx.moveTo(x - 15, footY - 70);
        ctx.lineTo(x - 20, footY);
        ctx.lineTo(x - 5, footY);
        ctx.lineTo(x - 5, footY - 70);
        ctx.fill();
        // Right leg  
        ctx.beginPath();
        ctx.moveTo(x + 5, footY - 70);
        ctx.lineTo(x + 5, footY);
        ctx.lineTo(x + 20, footY);
        ctx.lineTo(x + 15, footY - 70);
        ctx.fill();
        
        // === FEET (chappals) ===
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(x - 12, footY + 3, 12, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 12, footY + 3, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // === SAREE BODY ===
        ctx.fillStyle = mummyType.sareeColor;
        ctx.beginPath();
        ctx.moveTo(x - 25, footY - 70);
        ctx.quadraticCurveTo(x - 30, footY - 100, x - 20, footY - 120);
        ctx.lineTo(x + 20, footY - 120);
        ctx.quadraticCurveTo(x + 30, footY - 100, x + 25, footY - 70);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = mummyType.accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // === PALLU (draped part) ===
        ctx.fillStyle = mummyType.accentColor;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 20, footY - 120);
        ctx.quadraticCurveTo(x + 30, footY - 110, x + 35, footY - 80);
        ctx.lineTo(x + 25, footY - 80);
        ctx.quadraticCurveTo(x + 20, footY - 100, x - 15, footY - 110);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // === ARMS ===
        ctx.fillStyle = mummyType.skinTone;
        ctx.strokeStyle = mummyType.skinTone;
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        
        // Left arm (down or akimbo)
        ctx.beginPath();
        ctx.moveTo(x - 22, footY - 110);
        ctx.lineTo(x - 35, footY - 80);
        ctx.stroke();
        // Hand
        ctx.beginPath();
        ctx.arc(x - 37, footY - 75, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Right arm - posture based on expression
        if (expression === 'rage' || expression === 'furious' || 
            expression === 'ultimate_rage' || expression === 'angry') {
            // Raised arm with chappal!
            ctx.beginPath();
            ctx.moveTo(x + 22, footY - 110);
            ctx.lineTo(x + 50, footY - 145);
            ctx.stroke();
            // Hand
            ctx.beginPath();
            ctx.arc(x + 55, footY - 150, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // CHAPPAL in hand - the weapon!
            ctx.fillStyle = '#8B4513';
            ctx.save();
            ctx.translate(x + 60, footY - 160);
            ctx.rotate(-0.8);
            // Chappal body
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            // Chappal strap
            ctx.fillStyle = '#654321';
            ctx.fillRect(-6, -5, 12, 4);
            ctx.restore();
        } else {
            // Normal arm position
            ctx.beginPath();
            ctx.moveTo(x + 22, footY - 110);
            ctx.lineTo(x + 35, footY - 80);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(x + 37, footY - 75, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // === HEAD ===
        ctx.fillStyle = mummyType.skinTone;
        ctx.beginPath();
        ctx.arc(x, footY - 145, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // === HAIR ===
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(x, footY - 160, 20, 12, 0, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
        // Hair bun
        ctx.beginPath();
        ctx.arc(x - 18, footY - 150, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // === BINDI ===
        ctx.fillStyle = mummyType.bindiColor;
        ctx.beginPath();
        ctx.arc(x, footY - 155, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // === FACE - Expression based ===
        this.drawMummyFace(ctx, x, footY - 145, expression);
    }
    
    drawMummyFace(ctx, x, y, expression) {
        // Eyes
        const isAngry = expression === 'angry' || expression === 'rage' || 
                       expression === 'furious' || expression === 'ultimate_rage';
        const isShocked = expression === 'shocked' || expression === 'shock';
        
        // Eyebrows
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        if (isAngry) {
            // Angry V-shaped eyebrows
            ctx.beginPath();
            ctx.moveTo(x - 14, y - 12);
            ctx.lineTo(x - 6, y - 6);
            ctx.moveTo(x + 14, y - 12);
            ctx.lineTo(x + 6, y - 6);
            ctx.stroke();
        }
        
        // Eye whites
        ctx.fillStyle = '#fff';
        const eyeSize = isShocked ? 7 : 5;
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 3, eyeSize, eyeSize - 1, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 8, y - 3, eyeSize, eyeSize - 1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - 8, y - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(x + 8, y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        if (isAngry) {
            // Angry open mouth
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 10);
            ctx.quadraticCurveTo(x, y + 5, x + 10, y + 10);
            ctx.quadraticCurveTo(x, y + 18, x - 10, y + 10);
            ctx.fill();
            // Teeth
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 6, y + 8, 12, 4);
        } else if (isShocked) {
            // O-mouth
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse(x, y + 12, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Stern straight line
            ctx.beginPath();
            ctx.moveTo(x - 8, y + 12);
            ctx.lineTo(x + 8, y + 12);
            ctx.stroke();
        }
        
        // Nose
        ctx.strokeStyle = '#c4a07a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2, y + 6);
        ctx.lineTo(x, y + 6);
        ctx.stroke();
    }
    
    drawComicKid(ctx, x, y, expression) {
        // Ground level is at y, kid drawn upward (smaller than mummy)
        const footY = y;
        const scale = 0.75; // Kids are smaller
        
        // === LEGS ===
        ctx.fillStyle = '#5D4037'; // Brown pants/shorts
        ctx.beginPath();
        ctx.moveTo(x - 10, footY - 50);
        ctx.lineTo(x - 15, footY);
        ctx.lineTo(x - 3, footY);
        ctx.lineTo(x - 3, footY - 50);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 3, footY - 50);
        ctx.lineTo(x + 3, footY);
        ctx.lineTo(x + 15, footY);
        ctx.lineTo(x + 10, footY - 50);
        ctx.fill();
        
        // === SHOES ===
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(x - 9, footY + 3, 10, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 9, footY + 3, 10, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // === SHIRT/BODY ===
        ctx.fillStyle = '#2196F3'; // Blue shirt
        ctx.beginPath();
        ctx.moveTo(x - 18, footY - 50);
        ctx.lineTo(x - 20, footY - 85);
        ctx.lineTo(x + 20, footY - 85);
        ctx.lineTo(x + 18, footY - 50);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Shirt collar
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(x - 8, footY - 85);
        ctx.lineTo(x, footY - 78);
        ctx.lineTo(x + 8, footY - 85);
        ctx.fill();
        
        // === ARMS ===
        ctx.fillStyle = '#E8B89D';
        ctx.strokeStyle = '#E8B89D';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        
        if (expression === 'playing' || expression === 'mischievous') {
            // Arms up (playful)
            ctx.beginPath();
            ctx.moveTo(x - 18, footY - 75);
            ctx.lineTo(x - 30, footY - 95);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 18, footY - 75);
            ctx.lineTo(x + 30, footY - 95);
            ctx.stroke();
        } else if (expression === 'scared' || expression === 'terrified') {
            // Arms up in fear
            ctx.beginPath();
            ctx.moveTo(x - 18, footY - 75);
            ctx.lineTo(x - 25, footY - 100);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 18, footY - 75);
            ctx.lineTo(x + 25, footY - 100);
            ctx.stroke();
        } else {
            // Normal arms down
            ctx.beginPath();
            ctx.moveTo(x - 18, footY - 75);
            ctx.lineTo(x - 25, footY - 55);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 18, footY - 75);
            ctx.lineTo(x + 25, footY - 55);
            ctx.stroke();
        }
        
        // Hands
        ctx.beginPath();
        if (expression === 'playing' || expression === 'mischievous') {
            ctx.arc(x - 32, footY - 97, 6, 0, Math.PI * 2);
            ctx.arc(x + 32, footY - 97, 6, 0, Math.PI * 2);
        } else if (expression === 'scared' || expression === 'terrified') {
            ctx.arc(x - 27, footY - 102, 6, 0, Math.PI * 2);
            ctx.arc(x + 27, footY - 102, 6, 0, Math.PI * 2);
        } else {
            ctx.arc(x - 27, footY - 53, 6, 0, Math.PI * 2);
            ctx.arc(x + 27, footY - 53, 6, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // === HEAD ===
        ctx.fillStyle = '#E8B89D';
        ctx.beginPath();
        ctx.arc(x, footY - 105, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // === HAIR ===
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.ellipse(x, footY - 118, 16, 10, 0, Math.PI * 0.85, Math.PI * 2.15);
        ctx.fill();
        // Messy spikes
        ctx.beginPath();
        ctx.moveTo(x - 10, footY - 120);
        ctx.lineTo(x - 8, footY - 130);
        ctx.lineTo(x - 3, footY - 122);
        ctx.lineTo(x, footY - 132);
        ctx.lineTo(x + 3, footY - 122);
        ctx.lineTo(x + 8, footY - 130);
        ctx.lineTo(x + 10, footY - 120);
        ctx.fill();
        
        // === FACE ===
        this.drawKidFace(ctx, x, footY - 105, expression);
    }
    
    drawKidFace(ctx, x, y, expression) {
        const isScared = expression === 'scared' || expression === 'terrified';
        const isSweating = expression === 'sweating' || expression === 'nervous';
        const isHappy = expression === 'mischievous' || expression === 'playing';
        
        // Eye whites
        ctx.fillStyle = '#fff';
        const eyeW = isScared ? 7 : 5;
        const eyeH = isScared ? 8 : 5;
        ctx.beginPath();
        ctx.ellipse(x - 6, y - 2, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 6, y - 2, eyeW, eyeH, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Pupils
        ctx.fillStyle = '#000';
        const pupilX = isSweating ? 2 : 0; // Looking sideways if nervous
        ctx.beginPath();
        ctx.arc(x - 6 + pupilX, y - 1, 2, 0, Math.PI * 2);
        ctx.arc(x + 6 + pupilX, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyebrows
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        if (isScared) {
            // Worried eyebrows
            ctx.beginPath();
            ctx.moveTo(x - 10, y - 12);
            ctx.lineTo(x - 4, y - 10);
            ctx.moveTo(x + 10, y - 12);
            ctx.lineTo(x + 4, y - 10);
            ctx.stroke();
        }
        
        // Mouth
        if (isScared) {
            // Open scared mouth
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.ellipse(x, y + 10, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isHappy) {
            // Big smile
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 6, 8, 0.1, Math.PI - 0.1);
            ctx.stroke();
            // Teeth
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 5, y + 7, 10, 4);
        } else if (isSweating) {
            // Nervous crooked smile
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 6, y + 10);
            ctx.quadraticCurveTo(x, y + 6, x + 6, y + 10);
            ctx.stroke();
        } else {
            // Neutral/worried
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 10, 5, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
        
        // Sweat drop for nervous expressions
        if (isSweating || isScared) {
            ctx.fillStyle = '#64B5F6';
            ctx.beginPath();
            ctx.moveTo(x + 16, y - 8);
            ctx.quadraticCurveTo(x + 20, y, x + 16, y + 5);
            ctx.quadraticCurveTo(x + 12, y, x + 16, y - 8);
            ctx.fill();
        }
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
                
                // Detect kid hit - mummy gets HAPPY!
                if (chappal && obstacle.label === 'Kid') {
                    this.mummyExpression = 'happy';
                    this.expressionTimer = 2.0; // Stay happy for 2 seconds
                    // Celebration particles
                    this.poof(obstacle.position.x, obstacle.position.y, '#FFD700', 20);
                    sounds.playKidHit();
                    // Remove the kid
                    Composite.remove(this.world, obstacle);
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
                
                // Mummy gets SAD if not already happy (missed shot)
                if (this.mummyExpression !== 'happy') {
                    this.mummyExpression = 'sad';
                    this.expressionTimer = 1.5; // Stay sad for 1.5 seconds
                }
                
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
                
                // Draw floating elements (dust, sparkles)
                this.drawFloatingElements();

                this.drawMummy(this.anchor.x - (60 * this.scale), this.anchor.y + (30 * this.scale), this.scale);

                Composite.allBodies(this.world).forEach(b => {
                    this.ctx.save(); 
                    this.ctx.translate(b.position.x, b.position.y); 
                    this.ctx.rotate(b.angle);
                    const w = b.bounds.max.x - b.bounds.min.x; 
                    const h = b.bounds.max.y - b.bounds.min.y;
                    if (b.label === 'Chappal') this.drawChappal(w, h);
                    else if (b.label === 'Kid') this.drawKid(w / 2, b);
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

    drawKid(radius, body) {
        const ctx = this.ctx;
        
        // Check if chappal is nearby (within 200 units) - scared mode
        let isScared = false;
        let isVeryScared = false;
        if (this.chappal && body) {
            const dx = this.chappal.position.x - body.position.x;
            const dy = this.chappal.position.y - body.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            isScared = dist < 300;
            isVeryScared = dist < 150;
        }
        
        // PROVOCATION STATE - kids taunt when not scared
        const tauntCycle = (this.animTime + (body ? body.id * 0.5 : 0)) % 5;
        const isTaunting = !isScared && tauntCycle > 3.5 && tauntCycle < 4.5;
        const isShowingTongue = !isScared && tauntCycle > 2.5 && tauntCycle < 3.5;
        
        // Blinking animation (blink every 3 seconds for 0.1 seconds)
        const blinkCycle = this.animTime % 3;
        const isBlinking = blinkCycle > 2.9 && blinkCycle < 3.0 && !isTaunting;
        
        // Bouncing when taunting
        const bounce = isTaunting ? Math.sin(this.animTime * 15) * 3 : 0;
        
        // Subtle breathing animation
        const breathe = Math.sin(this.animTime * 2) * 0.02;
        ctx.save();
        ctx.translate(0, bounce);
        ctx.scale(1, 1 + breathe);
        
        // Face base
        ctx.fillStyle = '#FFCCBC'; 
        ctx.beginPath(); 
        ctx.arc(0, 0, radius, 0, Math.PI * 2); 
        ctx.fill();
        ctx.lineWidth = 2; 
        ctx.strokeStyle = '#E64A19'; 
        ctx.stroke();
        
        // Hair
        ctx.fillStyle = 'black'; 
        ctx.beginPath(); 
        ctx.arc(0, -radius * 0.2, radius - 1, Math.PI, 2 * Math.PI); 
        ctx.fill();
        ctx.beginPath(); 
        ctx.moveTo(-10, -radius); 
        ctx.lineTo(-5, -radius * 1.4); 
        ctx.lineTo(0, -radius); 
        ctx.moveTo(0, -radius); 
        ctx.lineTo(5, -radius * 1.4); 
        ctx.lineTo(10, -radius); 
        ctx.fill();
        
        // Eyes - with blinking and scared/taunting animation
        const eyeSize = isScared ? radius * 0.35 : (isTaunting ? radius * 0.25 : radius * 0.3);
        const pupilSize = isVeryScared ? radius * 0.05 : radius * 0.1;
        
        if (!isBlinking) {
            // Eye whites
            ctx.fillStyle = 'white'; 
            ctx.beginPath(); 
            ctx.arc(-radius * 0.3, -2, eyeSize, 0, Math.PI * 2); 
            ctx.arc(radius * 0.3, -2, eyeSize, 0, Math.PI * 2); 
            ctx.fill();
            
            // Pupils - look at chappal if scared, look at mummy if taunting
            let pupilOffsetX = 0;
            let pupilOffsetY = 0;
            if (isScared && this.chappal && body) {
                const dx = this.chappal.position.x - body.position.x;
                const dy = this.chappal.position.y - body.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                pupilOffsetX = (dx / dist) * radius * 0.1;
                pupilOffsetY = (dy / dist) * radius * 0.1;
            } else if (isTaunting || isShowingTongue) {
                // Look towards mummy (left side)
                pupilOffsetX = -radius * 0.08;
            }
            
            ctx.fillStyle = 'black'; 
            ctx.beginPath(); 
            ctx.arc(-radius * 0.3 + pupilOffsetX, -2 + pupilOffsetY, pupilSize, 0, Math.PI * 2); 
            ctx.arc(radius * 0.3 + pupilOffsetX, -2 + pupilOffsetY, pupilSize, 0, Math.PI * 2); 
            ctx.fill();
            
            // Mischievous squint when taunting
            if (isTaunting) {
                ctx.strokeStyle = '#E64A19';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(-radius * 0.3, -2, eyeSize * 0.6, Math.PI * 0.8, Math.PI * 0.2);
                ctx.arc(radius * 0.3, -2, eyeSize * 0.6, Math.PI * 0.8, Math.PI * 0.2);
                ctx.stroke();
            }
        } else {
            // Closed eyes (blinking)
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-radius * 0.45, -2);
            ctx.lineTo(-radius * 0.15, -2);
            ctx.moveTo(radius * 0.15, -2);
            ctx.lineTo(radius * 0.45, -2);
            ctx.stroke();
        }
        
        // Sweat drop when scared
        if (isScared) {
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.moveTo(radius * 0.5, -radius * 0.3);
            ctx.quadraticCurveTo(radius * 0.7, -radius * 0.1, radius * 0.5, radius * 0.1);
            ctx.quadraticCurveTo(radius * 0.3, -radius * 0.1, radius * 0.5, -radius * 0.3);
            ctx.fill();
        }
        
        // Mouth - scared, taunting, or normal
        ctx.fillStyle = '#3E2723';
        if (isVeryScared) {
            // Open mouth (scared)
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.4, radius * 0.2, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isScared) {
            // Worried mouth
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.4, radius * 0.18, radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isShowingTongue) {
            // TONGUE SHOWING! 👅
            // Open mouth
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.45, radius * 0.2, radius * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pink tongue sticking out
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.65, radius * 0.15, radius * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
            // Tongue highlight
            ctx.fillStyle = '#FF8A8A';
            ctx.beginPath();
            ctx.ellipse(0, radius * 0.6, radius * 0.08, radius * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (isTaunting) {
            // Mocking grin
            ctx.strokeStyle = '#3E2723';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, radius * 0.35, radius * 0.2, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
            // Cheeky cheeks
            ctx.fillStyle = 'rgba(255, 150, 150, 0.5)';
            ctx.beginPath();
            ctx.arc(-radius * 0.5, radius * 0.2, radius * 0.12, 0, Math.PI * 2);
            ctx.arc(radius * 0.5, radius * 0.2, radius * 0.12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Normal mouth
            ctx.beginPath(); 
            ctx.ellipse(0, radius * 0.4, radius * 0.15, radius * 0.25, 0, 0, Math.PI * 2); 
            ctx.fill();
        }
        
        ctx.restore(); // End breathing/bounce transform
        
        // HANDS ON EARS TAUNT when taunting! 
        if (isTaunting) {
            ctx.fillStyle = '#FFCCBC';
            // Left hand at ear
            ctx.save();
            ctx.translate(-radius * 0.9, -radius * 0.1);
            ctx.rotate(Math.sin(this.animTime * 10) * 0.3); // Waggle!
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.2, radius * 0.15, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Fingers
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(-radius * 0.25 - i * 3, -3, 8, 6);
            }
            ctx.restore();
            
            // Right hand at ear
            ctx.save();
            ctx.translate(radius * 0.9, -radius * 0.1);
            ctx.rotate(-Math.sin(this.animTime * 10) * 0.3); // Waggle opposite!
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.2, radius * 0.15, -0.3, 0, Math.PI * 2);
            ctx.fill();
            // Fingers
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(radius * 0.05 + i * 3, -3, 8, 6);
            }
            ctx.restore();
        }
        
        // Legs (outside breathing transform)
        ctx.fillStyle = '#1E88E5'; 
        ctx.save(); 
        ctx.translate(-radius * 0.3, radius * 0.8); 
        ctx.rotate(0.2 + (isTaunting ? Math.sin(this.animTime * 15) * 0.1 : 0)); 
        ctx.fillRect(-radius * 0.15, 0, radius * 0.3, radius * 0.6); 
        ctx.fillStyle = 'black'; 
        ctx.fillRect(-radius * 0.15, radius * 0.6, radius * 0.35, radius * 0.2); 
        ctx.restore();
        ctx.fillStyle = '#1E88E5'; 
        ctx.save(); 
        ctx.translate(radius * 0.3, radius * 0.8); 
        ctx.rotate(-0.2 - (isTaunting ? Math.sin(this.animTime * 15) * 0.1 : 0)); 
        ctx.fillRect(-radius * 0.15, 0, radius * 0.3, radius * 0.6); 
        ctx.fillStyle = 'black'; 
        ctx.fillRect(-radius * 0.15, radius * 0.6, radius * 0.35, radius * 0.2); 
        ctx.restore();
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
        // Get selected mummy's colors
        const mummyType = MUMMY_TYPES[this.selectedMummyIdx] || MUMMY_TYPES[0];
        const sareeColor = mummyType.sareeColor;
        const accentColor = mummyType.accentColor;
        const skinTone = mummyType.skinTone;
        const bindiColor = mummyType.bindiColor;
        
        // Anger shake effect
        const isAngry = this.mummyExpression === 'angry';
        const shakeX = isAngry ? Math.sin(this.animTime * 30) * 2 : 0;
        
        this.ctx.save(); 
        this.ctx.translate(x + shakeX, y); 
        this.ctx.scale(s, s); 
        const lx = 0, ly = 0;
        
        // Angry red overlay effect
        if (isAngry) {
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(lx, ly - 30, 80, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
        
        // Feet
        this.ctx.fillStyle = skinTone;
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
        // ============================================
        // REGION-SPECIFIC HAIRSTYLE DRAWING
        // ============================================
        const outfitId = mummyType.id;
        this.ctx.fillStyle = '#212121'; // Hair color
        
        if (outfitId === 'punjabi') {
            // PUNJABI - Long braid with Paranda (colorful tassels)
            // Hair base flowing down
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 18, ly - 70);
            this.ctx.quadraticCurveTo(lx - 30, ly - 50, lx - 32, ly - 20);
            this.ctx.lineTo(lx - 28, ly - 20);
            this.ctx.quadraticCurveTo(lx - 26, ly - 50, lx - 14, ly - 70);
            this.ctx.fill();
            // Braid pattern
            this.ctx.strokeStyle = '#1a1a1a';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.moveTo(lx - 28, ly - 55 + i * 8);
                this.ctx.lineTo(lx - 32, ly - 51 + i * 8);
                this.ctx.stroke();
            }
            // Paranda (colorful tassels)
            this.ctx.fillStyle = '#FF5722';
            this.ctx.beginPath();
            this.ctx.arc(lx - 30, ly - 15, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(lx - 30, ly - 8, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.arc(lx - 30, ly - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
        } else if (outfitId === 'tamil' || outfitId === 'marathi') {
            // TAMIL/MARATHI - Side bun with PROPER Gajra (jasmine string)
            // Low side bun - larger and more defined
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.arc(lx - 26, ly - 48, 18, 0, Math.PI * 2);
            this.ctx.fill();
            
            // GAJRA - Proper jasmine string wrapped around bun
            // Draw as connected flower string, not scattered circles
            this.ctx.strokeStyle = '#90EE90'; // Light green thread
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(lx - 26, ly - 48, 20, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // Jasmine flowers ON the string - clustered like real gajra
            this.ctx.fillStyle = 'white';
            this.ctx.strokeStyle = '#FFFDE7'; // Slight yellow tint for realism
            this.ctx.lineWidth = 0.5;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const gx = lx - 26 + Math.cos(angle) * 20;
                const gy = ly - 48 + Math.sin(angle) * 20;
                // Draw jasmine as small cluster of petals
                this.ctx.beginPath();
                this.ctx.arc(gx, gy, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                // Add tiny petal details
                this.ctx.fillStyle = '#FFFDE7';
                this.ctx.beginPath();
                this.ctx.arc(gx + 1, gy - 1, 1, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'white';
            }
            
            // Second inner ring of gajra
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2 + 0.2;
                const gx = lx - 26 + Math.cos(angle) * 12;
                const gy = ly - 48 + Math.sin(angle) * 12;
                this.ctx.beginPath();
                this.ctx.arc(gx, gy, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
        } else if (outfitId === 'bengali') {
            // BENGALI - Center-parted hair with bun
            // Hair bun on one side
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.arc(lx - 24, ly - 50, 14, 0, Math.PI * 2);
            this.ctx.fill();
            // Note: Sindoor will be drawn on the HEAD/FACE section below
            
        } else if (outfitId === 'gujarati' || outfitId === 'rajasthani') {
            // GUJARATI/RAJASTHANI - Hair covered by Ghunghat/Odhni
            // Hidden hair underneath
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.arc(lx - 5, ly - 55, 10, 0, Math.PI * 2);
            this.ctx.fill();
            // Ghunghat covering head
            this.ctx.fillStyle = sareeColor;
            this.ctx.globalAlpha = 0.85;
            this.ctx.beginPath();
            this.ctx.ellipse(lx - 5, ly - 55, 28, 20, 0.1, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            // Decorative border on ghunghat
            this.ctx.strokeStyle = accentColor;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(lx - 5, ly - 55, 28, 20, 0.1, 0, Math.PI * 2);
            this.ctx.stroke();
            // Borla (head jewelry) for Rajasthani
            if (outfitId === 'rajasthani') {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(lx, ly - 72, 5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(lx, ly - 67);
                this.ctx.lineTo(lx, ly - 60);
                this.ctx.stroke();
            }
            
        } else if (outfitId === 'malayali') {
            // MALAYALI - Long flowing hair with jasmine STRING on side
            // Long hair flowing down
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 15, ly - 70);
            this.ctx.quadraticCurveTo(lx - 30, ly - 40, lx - 25, ly);
            this.ctx.lineTo(lx - 18, ly);
            this.ctx.quadraticCurveTo(lx - 22, ly - 40, lx - 10, ly - 70);
            this.ctx.fill();
            
            // Jasmine string along the hair - connected flowers
            this.ctx.strokeStyle = '#90EE90'; // Green thread
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 27, ly - 65);
            this.ctx.quadraticCurveTo(lx - 30, ly - 30, lx - 26, ly - 5);
            this.ctx.stroke();
            
            // Jasmine flowers on the string
            this.ctx.fillStyle = 'white';
            for (let i = 0; i < 8; i++) {
                const fy = ly - 60 + i * 7;
                this.ctx.beginPath();
                this.ctx.arc(lx - 27, fy, 3, 0, Math.PI * 2);
                this.ctx.fill();
                // Petal detail
                this.ctx.fillStyle = '#FFFDE7';
                this.ctx.beginPath();
                this.ctx.arc(lx - 26, fy - 1, 1, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'white';
            }
            
        } else if (outfitId === 'bihari') {
            // BIHARI - Traditional bun
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.arc(lx - 22, ly - 52, 14, 0, Math.PI * 2);
            this.ctx.fill();
            // Note: Heavy sindoor will be drawn on HEAD/FACE section
            
        } else {
            // DEFAULT - Simple hair bun
            this.ctx.fillStyle = '#212121';
            this.ctx.beginPath();
            this.ctx.arc(lx - 25, ly - 55, 14, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // ============================================
        // REGION-SPECIFIC OUTFIT DRAWING
        // ============================================
        const outfitType = mummyType.id;
        
        if (outfitType === 'punjabi') {
            // PUNJABI - Salwar Kameez (kurta + pants)
            // Salwar (pants)
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 20, ly + 20);
            this.ctx.lineTo(lx - 25, ly + 65);
            this.ctx.lineTo(lx - 5, ly + 65);
            this.ctx.lineTo(lx, ly + 20);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(lx + 20, ly + 20);
            this.ctx.lineTo(lx + 25, ly + 65);
            this.ctx.lineTo(lx + 5, ly + 65);
            this.ctx.lineTo(lx, ly + 20);
            this.ctx.fill();
            // Kameez (kurta top)
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly - 10, 30, 50, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Dupatta (scarf)
            this.ctx.fillStyle = accentColor;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 25, ly - 40);
            this.ctx.quadraticCurveTo(lx + 40, ly - 20, lx + 35, ly + 30);
            this.ctx.lineTo(lx + 20, ly + 25);
            this.ctx.quadraticCurveTo(lx + 30, ly - 10, lx - 20, ly - 35);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
        } else if (outfitType === 'tamil') {
            // TAMIL - Traditional Saree with Gajra (jasmine flowers)
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Gold border on saree
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // Pallu
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 10, ly - 40);
            this.ctx.quadraticCurveTo(lx + 20, ly - 20, lx + 35, ly + 20);
            this.ctx.lineTo(lx + 10, ly + 20);
            this.ctx.fill();
            // GAJRA (jasmine garland) in hair - white flowers
            this.ctx.fillStyle = 'white';
            for (let i = 0; i < 6; i++) {
                this.ctx.beginPath();
                this.ctx.arc(lx - 30 + i * 3, ly - 58 - Math.sin(i) * 2, 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
        } else if (outfitType === 'bengali') {
            // BENGALI - White Saree with Red Border (Laal Paar)
            this.ctx.fillStyle = '#FFFFFF'; // White base
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Red border
            this.ctx.strokeStyle = '#D50000';
            this.ctx.lineWidth = 5;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // Red pallu
            this.ctx.fillStyle = '#D50000';
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 10, ly - 40);
            this.ctx.quadraticCurveTo(lx + 20, ly - 20, lx + 35, ly + 20);
            this.ctx.lineTo(lx + 10, ly + 20);
            this.ctx.fill();
            // Shakha-Pola bangles (white & red) on wrists drawn later
            
        } else if (outfitType === 'gujarati') {
            // GUJARATI - Chaniya Choli (Ghagra + Choli)
            // Ghagra (skirt) with flare
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 10, ly - 10);
            this.ctx.lineTo(lx - 40, ly + 65);
            this.ctx.lineTo(lx + 40, ly + 65);
            this.ctx.lineTo(lx + 10, ly - 10);
            this.ctx.fill();
            // Mirror work dots
            this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.arc(lx - 25 + i * 12, ly + 30, 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            // Choli (blouse)
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly - 25, 25, 25, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Odhni (dupatta) over head
            this.ctx.fillStyle = sareeColor;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(lx, ly - 60, 30, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
        } else if (outfitType === 'marathi') {
            // MARATHI - Nauvari (9-yard saree, kashta style)
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Distinctive kashta drape (dhoti-style between legs)
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 5, ly + 10);
            this.ctx.lineTo(lx, ly + 65);
            this.ctx.lineTo(lx + 5, ly + 10);
            this.ctx.fill();
            // Pallu tucked at back
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 30, ly - 30);
            this.ctx.quadraticCurveTo(lx - 35, ly, lx - 30, ly + 20);
            this.ctx.lineTo(lx - 20, ly + 15);
            this.ctx.fill();
            // NATH (nose ring) drawn on face later
            
        } else if (outfitType === 'malayali') {
            // MALAYALI - Kasavu Mundu (cream/gold saree)
            this.ctx.fillStyle = '#FFFDD0'; // Cream
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Gold kasavu border
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // Second gold line
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 32, 62, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // Jasmine in hair (like Tamil)
            this.ctx.fillStyle = 'white';
            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                this.ctx.arc(lx - 28 + i * 3, ly - 57, 2.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
        } else if (outfitType === 'rajasthani') {
            // RAJASTHANI - Ghagra Choli with heavy embroidery
            // Ghagra (wide flared skirt)
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 15, ly);
            this.ctx.lineTo(lx - 45, ly + 65);
            this.ctx.lineTo(lx + 45, ly + 65);
            this.ctx.lineTo(lx + 15, ly);
            this.ctx.fill();
            // Embroidery pattern
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < 7; i++) {
                this.ctx.beginPath();
                this.ctx.arc(lx - 30 + i * 10, ly + 40, 5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            // Choli
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly - 20, 28, 30, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Heavy odhni covering head
            this.ctx.fillStyle = sareeColor;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.ellipse(lx - 5, ly - 55, 35, 25, 0.2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            // Borla (head jewelry) drawn on face
            
        } else if (outfitType === 'bihari') {
            // BIHARI - Traditional Saree with heavy sindoor
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Golden border
            this.ctx.strokeStyle = '#DAA520';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.stroke();
            // Pallu
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 10, ly - 40);
            this.ctx.quadraticCurveTo(lx + 20, ly - 20, lx + 35, ly + 20);
            this.ctx.lineTo(lx + 10, ly + 20);
            this.ctx.fill();
            // Heavy SINDOOR in maang (drawn on head later)
            
        } else {
            // DEFAULT SAREE
            this.ctx.fillStyle = sareeColor;
            this.ctx.beginPath();
            this.ctx.ellipse(lx, ly, 35, 65, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = accentColor;
            this.ctx.beginPath();
            this.ctx.moveTo(lx - 10, ly - 40);
            this.ctx.quadraticCurveTo(lx + 20, ly - 20, lx + 35, ly + 20);
            this.ctx.lineTo(lx + 10, ly + 20);
            this.ctx.fill();
        }
        
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
        this.ctx.fillStyle = skinTone; // Use selected mummy's skin tone
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
        
        // ============================================
        // SINDOOR IN MAANG (Hair Parting) - Bengali & Bihari
        // ============================================
        if (outfitId === 'bengali') {
            // BENGALI SINDOOR - Red line in the hair parting
            this.ctx.fillStyle = '#D50000';
            // Draw sindoor as a red line in the center parting of hair
            this.ctx.beginPath();
            this.ctx.moveTo(-2, -22);
            this.ctx.lineTo(2, -22);
            this.ctx.lineTo(1, -12);
            this.ctx.lineTo(-1, -12);
            this.ctx.closePath();
            this.ctx.fill();
        } else if (outfitId === 'bihari') {
            // BIHARI SINDOOR - HEAVY vermillion filling the entire parting
            this.ctx.fillStyle = '#D50000';
            // Much thicker sindoor - signature Bihari style
            this.ctx.beginPath();
            this.ctx.moveTo(-4, -24);
            this.ctx.lineTo(4, -24);
            this.ctx.lineTo(3, -10);
            this.ctx.lineTo(-3, -10);
            this.ctx.closePath();
            this.ctx.fill();
            // Maang tikka jewelry
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(0, -26, 4, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(0, -20, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        // Eyes - size changes based on expression
        const eyeScaleY = this.mummyExpression === 'happy' ? 3 : 
                          this.mummyExpression === 'sad' ? 5 : 
                          this.mummyExpression === 'angry' ? 6 : 4;
        this.ctx.fillStyle = 'white'; 
        this.ctx.beginPath(); 
        this.ctx.ellipse(-8, 2, 6, eyeScaleY, 0, 0, Math.PI * 2); 
        this.ctx.ellipse(8, 2, 6, eyeScaleY, 0, 0, Math.PI * 2); 
        this.ctx.fill();
        
        // Angry eye veins
        if (this.mummyExpression === 'angry') {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(-12, 0); this.ctx.lineTo(-8, 2);
            this.ctx.moveTo(-12, 4); this.ctx.lineTo(-8, 2);
            this.ctx.moveTo(12, 0); this.ctx.lineTo(8, 2);
            this.ctx.moveTo(12, 4); this.ctx.lineTo(8, 2);
            this.ctx.stroke();
        }
        
        // Pupils - position shifts based on expression
        const pupilY = this.mummyExpression === 'happy' ? 3 : 
                       this.mummyExpression === 'sad' ? 3 : 2;
        this.ctx.fillStyle = 'black'; 
        this.ctx.beginPath(); 
        this.ctx.arc(-7, pupilY, 2, 0, Math.PI * 2); 
        this.ctx.arc(9, pupilY, 2, 0, Math.PI * 2); 
        this.ctx.fill();
        
        // Eyebrows - angle changes based on expression
        this.ctx.lineWidth = 2.5; 
        this.ctx.strokeStyle = '#212121';
        if (this.mummyExpression === 'happy') {
            // Raised, curved eyebrows (happy)
            this.ctx.beginPath(); 
            this.ctx.moveTo(-14, -1); 
            this.ctx.quadraticCurveTo(-9, -4, -4, -1); 
            this.ctx.stroke(); 
            this.ctx.beginPath(); 
            this.ctx.moveTo(4, -1); 
            this.ctx.quadraticCurveTo(9, -4, 14, -1); 
            this.ctx.stroke();
        } else if (this.mummyExpression === 'sad') {
            // Angled down eyebrows (worried/sad)
            this.ctx.beginPath(); 
            this.ctx.moveTo(-14, -4); 
            this.ctx.lineTo(-4, -1); 
            this.ctx.stroke(); 
            this.ctx.beginPath(); 
            this.ctx.moveTo(4, -1); 
            this.ctx.lineTo(14, -4); 
            this.ctx.stroke();
        } else if (this.mummyExpression === 'angry') {
            // ANGRY V-shaped eyebrows
            this.ctx.lineWidth = 3.5;
            this.ctx.beginPath(); 
            this.ctx.moveTo(-14, -1); 
            this.ctx.lineTo(-4, -5); 
            this.ctx.stroke(); 
            this.ctx.beginPath(); 
            this.ctx.moveTo(4, -5); 
            this.ctx.lineTo(14, -1); 
            this.ctx.stroke();
        } else {
            // Neutral eyebrows
            this.ctx.beginPath(); 
            this.ctx.moveTo(-14, -2); 
            this.ctx.lineTo(-4, 0); 
            this.ctx.stroke(); 
            this.ctx.beginPath(); 
            this.ctx.moveTo(4, 0); 
            this.ctx.lineTo(14, -2); 
            this.ctx.stroke();
        }
        
        // Bindi - USE SELECTED MUMMY'S BINDI COLOR
        this.ctx.fillStyle = bindiColor; 
        this.ctx.beginPath(); 
        this.ctx.arc(0, -6, 3, 0, Math.PI * 2); 
        this.ctx.fill();
        
        // Mouth - expression-based
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        if (this.mummyExpression === 'happy') {
            // Big happy smile
            this.ctx.strokeStyle = '#C62828';
            this.ctx.beginPath();
            this.ctx.arc(0, 10, 8, 0.1 * Math.PI, 0.9 * Math.PI);
            this.ctx.stroke();
            // Teeth showing
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(-5, 10, 10, 4);
        } else if (this.mummyExpression === 'sad') {
            // Sad frown
            this.ctx.strokeStyle = '#5D4037';
            this.ctx.beginPath();
            this.ctx.arc(0, 18, 6, 1.1 * Math.PI, 1.9 * Math.PI);
            this.ctx.stroke();
        } else if (this.mummyExpression === 'angry') {
            // ANGRY yelling mouth - wide open
            this.ctx.fillStyle = '#8B0000';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 14, 8, 6, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Teeth
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(-6, 11, 12, 3);
        } else {
            // Neutral slight curve
            this.ctx.strokeStyle = '#5D4037';
            this.ctx.beginPath();
            this.ctx.arc(0, 12, 5, 0.15 * Math.PI, 0.85 * Math.PI);
            this.ctx.stroke();
        }
        
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

    // ========================================
    // FLOATING BACKGROUND ELEMENTS - Living Backgrounds
    // ========================================
    initFloatingElements() {
        this.floatingElements = [];
        // Create dust particles and floating elements
        for (let i = 0; i < 15; i++) {
            this.floatingElements.push({
                x: Math.random() * 1200,
                y: Math.random() * 600,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 20,
                speedY: (Math.random() - 0.5) * 10 - 5,
                opacity: Math.random() * 0.3 + 0.1,
                type: Math.random() > 0.7 ? 'sparkle' : 'dust'
            });
        }
    }
    
    updateFloatingElements(delta) {
        if (!this.gameActive) return;
        
        this.floatingElements.forEach(el => {
            el.x += el.speedX * delta;
            el.y += el.speedY * delta;
            
            // Float effect
            el.y += Math.sin(this.animTime * 2 + el.x * 0.01) * 0.5;
            
            // Wrap around screen
            if (el.x < 0) el.x = this.width;
            if (el.x > this.width) el.x = 0;
            if (el.y < 0) el.y = this.height - 100;
            if (el.y > this.height - 50) el.y = 0;
        });
    }
    
    drawFloatingElements() {
        const ctx = this.ctx;
        const bg = LEVEL_BACKGROUNDS[this.currentLevelIdx] || LEVEL_BACKGROUNDS[0];
        
        this.floatingElements.forEach(el => {
            ctx.save();
            ctx.globalAlpha = el.opacity * (0.5 + Math.sin(this.animTime * 3 + el.x) * 0.5);
            
            if (el.type === 'sparkle') {
                // Sparkle effect
                ctx.fillStyle = bg.accent || '#FFD700';
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.size * (0.8 + Math.sin(this.animTime * 5) * 0.2), 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Dust particle
                ctx.fillStyle = this.isDarkTheme() ? 'rgba(255,255,255,0.5)' : 'rgba(139,69,19,0.3)';
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }
    
    isDarkTheme() {
        const darkThemes = ['bedroom_night', 'study_night', 'bedroom_dark', 'boss', 'angry'];
        const bg = LEVEL_BACKGROUNDS[this.currentLevelIdx];
        return bg && darkThemes.includes(bg.theme);
    }

    loop() {
        // Update animation time for living elements
        const now = Date.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.animTime += delta;
        
        // Update mummy expression timer
        if (this.expressionTimer > 0) {
            this.expressionTimer -= delta;
            if (this.expressionTimer <= 0) {
                this.mummyExpression = 'neutral';
            }
        }
        
        // KID PROVOCATION DETECTION - triggers mummy anger!
        if (this.gameActive && !this.isPaused && !this.isGameOver) {
            this.kidProvocationTimer -= delta;
            
            // Check if any kid is currently taunting
            let anyKidTaunting = false;
            const tauntCheckTime = this.animTime % 5;
            if (tauntCheckTime > 3.5 && tauntCheckTime < 4.5) {
                // Kids are taunting right now
                anyKidTaunting = Composite.allBodies(this.world).some(b => b.label === 'Kid');
            }
            
            // Trigger mummy anger when kids taunt (with cooldown)
            if (anyKidTaunting && this.kidProvocationTimer <= 0 && this.mummyExpression !== 'happy') {
                this.mummyExpression = 'angry';
                this.expressionTimer = 1.5; // Stay angry for 1.5 seconds
                this.kidProvocationTimer = 5; // 5 second cooldown between anger triggers
                
                // Play angry sound + dramatic sting!
                sounds.playMummyAngry();
                sounds.playDramaticSting();
            }
            
            // Reset provocation timer if it goes too negative
            if (this.kidProvocationTimer < -10) {
                this.kidProvocationTimer = 0;
            }
        }
        
        this.update();
        this.updateFloatingElements(delta);
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ========================================
// INITIALIZE GAME
// ========================================
const game = new Game();
