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
// LEVEL BUILDER
// ========================================
const buildLevel = (idx, world, sx, sy, s) => {
    const mkBox = (x, y, sz) => Composite.add(world, Bodies.rectangle(x, y, sz, sz, { 
        density: 0.002, 
        label: 'Book', 
        friction: 0.6 
    }));
    
    const mkKid = (x, y) => Composite.add(world, Bodies.circle(x, y, s * 0.4, { 
        restitution: 0.6, 
        label: 'Kid', 
        density: 0.003 
    }));
    
    const mkPlank = (x, y, wd, ht) => Composite.add(world, Bodies.rectangle(x, y, wd, ht, { 
        density: 0.005, 
        label: 'Wood', 
        friction: 0.6 
    }));

    // Level-specific patterns
    if (idx === 0) { // Homework
        mkBox(sx - s, sy - s / 2, s); 
        mkBox(sx + s, sy - s / 2, s); 
        mkKid(sx, sy - s / 2); 
        mkPlank(sx, sy - s * 1.2, s * 3, s * 0.3); 
        mkKid(sx, sy - s * 1.6);
    } else if (idx === 1) { // Sofa
        mkBox(sx - s * 1.5, sy - s, s); 
        mkBox(sx + s * 1.5, sy - s, s); 
        mkPlank(sx, sy - s * 1.8, s * 4, s * 0.4); 
        mkKid(sx, sy - s / 2); 
        mkKid(sx - s, sy - s / 2); 
        mkKid(sx + s, sy - s / 2);
    } else {
        // Generic Generation for other levels
        const rows = 2 + Math.floor(idx / 3);
        for (let i = 0; i < rows; i++) {
            let y = sy - s / 2 - (i * s * 1.2);
            if (i % 2 === 0) { 
                mkBox(sx - s, y, s); 
                mkBox(sx + s, y, s); 
            } else { 
                mkKid(sx, y); 
            }
        }
        mkPlank(sx, sy - (rows * s * 1.2), s * 3, s * 0.3);
        mkKid(sx, sy - (rows * s * 1.2) - s);
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
                const floorH = 40 * this.scale;
                this.ctx.fillStyle = '#795548'; 
                this.ctx.fillRect(0, this.height - floorH, this.width, floorH);
                this.ctx.fillStyle = '#5D4037'; 
                this.ctx.fillRect(0, this.height - floorH, this.width, floorH * 0.15);

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
