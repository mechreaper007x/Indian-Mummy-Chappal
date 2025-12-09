/**
 * Kid Launch Effect - Looney Tunes "Splat on Glass" visual
 * Enhanced with cartoon face-stick effect like Wile E. Coyote
 * Triggers when the last kid standing gets hit
 * Created for Indian Mummy: Chappal
 */

class KidLauncher {
    constructor() {
        this.isLaunching = false;
        this.container = null;
        this.kidElement = null;
        this.splatFace = null;
        this.crackOverlay = null;
        this.droolElements = [];
        this.init();
    }

    init() {
        // Create container for the effect
        this.container = document.createElement('div');
        this.container.id = 'kid-launch-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
            display: none;
        `;
        document.body.appendChild(this.container);

        // Create crack overlay (pre-created, hidden)
        this.crackOverlay = document.createElement('div');
        this.crackOverlay.className = 'screen-crack-overlay';
        this.container.appendChild(this.crackOverlay);
        
        // Create glass smear overlay
        this.smearOverlay = document.createElement('div');
        this.smearOverlay.className = 'glass-smear-overlay';
        this.container.appendChild(this.smearOverlay);
    }

    /**
     * Launch the kid at the screen - LOONEY TUNES STYLE!
     * @param {number} startX - Starting X position (canvas coords)
     * @param {number} startY - Starting Y position (canvas coords)
     * @param {object} kidData - Optional kid appearance data
     * @param {function} onComplete - Callback when animation finishes
     */
    launch(startX, startY, kidData = {}, onComplete = null) {
        if (this.isLaunching) return;
        this.isLaunching = true;
        this.container.style.display = 'block';

        // Get canvas bounds to convert coordinates
        const canvas = document.getElementById('world');
        const rect = canvas.getBoundingClientRect();
        
        // Convert canvas coords to screen coords
        const screenX = rect.left + (startX / canvas.width) * rect.width;
        const screenY = rect.top + (startY / canvas.height) * rect.height;

        // Create flying kid element (normal face, flying towards screen)
        this.kidElement = document.createElement('div');
        this.kidElement.className = 'flying-kid';
        this.kidElement.innerHTML = this.createFlyingKidSVG(kidData);
        this.kidElement.style.cssText = `
            position: absolute;
            left: ${screenX}px;
            top: ${screenY}px;
            width: 80px;
            height: 80px;
            transform: translate(-50%, -50%) scale(0.3);
            z-index: 100;
            filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
        `;
        this.container.appendChild(this.kidElement);

        // Phase 1: Fly towards screen center with spin (getting bigger = closer)
        requestAnimationFrame(() => {
            this.kidElement.style.transition = 'all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.kidElement.style.left = '50%';
            this.kidElement.style.top = '50%';
            this.kidElement.style.transform = 'translate(-50%, -50%) scale(4) rotate(360deg)';
        });

        // Phase 2: SPLAT! - The iconic face-against-glass moment
        setTimeout(() => {
            // Remove flying kid, replace with splat face
            this.kidElement.style.display = 'none';
            
            // Create the flattened "pressed against glass" face
            this.splatFace = document.createElement('div');
            this.splatFace.className = 'splat-face';
            this.splatFace.innerHTML = this.createSplatFaceSVG(kidData);
            this.splatFace.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 400px;
                height: 300px;
                transform: translate(-50%, -50%) scale(0.1);
                z-index: 200;
                opacity: 0;
            `;
            this.container.appendChild(this.splatFace);
            
            // SPLAT expansion animation
            requestAnimationFrame(() => {
                this.splatFace.style.transition = 'all 0.08s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
                this.splatFace.style.transform = 'translate(-50%, -50%) scale(1.2) scaleY(0.7)';
                this.splatFace.style.opacity = '1';
            });
            
            // Show cracks and shake
            this.crackOverlay.classList.add('visible');
            this.shakeScreen(15);
            this.playImpactSound();
            
        }, 350);
        
        // Phase 3: Elastic bounce-back (face unstretches slightly)
        setTimeout(() => {
            this.splatFace.style.transition = 'all 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            this.splatFace.style.transform = 'translate(-50%, -50%) scale(1) scaleY(0.85)';
        }, 430);
        
        // Phase 4: Face sticks and wobbles (cartoon jello effect)
        setTimeout(() => {
            this.addWobbleEffect();
            this.smearOverlay.classList.add('visible');
        }, 580);
        
        // Phase 5: Slow squeaky slide down with face smear
        setTimeout(() => {
            this.startSlideDown();
        }, 1200);

        // Cleanup
        setTimeout(() => {
            this.cleanup();
            if (onComplete) onComplete();
        }, 3500);
    }

    createFlyingKidSVG(kidData) {
        const skinTone = kidData.skinTone || '#E8B89D';
        const hairColor = kidData.hairColor || '#1a1a1a';
        
        // Normal flying face with wind effect
        return `
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <!-- Head -->
                <circle cx="50" cy="45" r="32" fill="${skinTone}"/>
                <!-- Hair (wind-blown) -->
                <ellipse cx="50" cy="22" rx="30" ry="16" fill="${hairColor}"/>
                <path d="M25 25 Q15 30 10 20" stroke="${hairColor}" stroke-width="5" fill="none"/>
                <path d="M75 25 Q85 30 90 20" stroke="${hairColor}" stroke-width="5" fill="none"/>
                <!-- Eyes (terrified) -->
                <ellipse cx="38" cy="42" rx="10" ry="12" fill="white"/>
                <ellipse cx="62" cy="42" rx="10" ry="12" fill="white"/>
                <circle cx="40" cy="44" r="5" fill="#1a1a1a"/>
                <circle cx="64" cy="44" r="5" fill="#1a1a1a"/>
                <circle cx="41" cy="43" r="1.5" fill="white"/>
                <circle cx="65" cy="43" r="1.5" fill="white"/>
                <!-- Eyebrows (panicked) -->
                <path d="M28 30 L48 38" stroke="${hairColor}" stroke-width="3" fill="none"/>
                <path d="M72 30 L52 38" stroke="${hairColor}" stroke-width="3" fill="none"/>
                <!-- Mouth (screaming) -->
                <ellipse cx="50" cy="62" rx="12" ry="15" fill="#2d0000"/>
                <path d="M40 58 Q50 52 60 58" fill="#FF6B6B"/>
                <!-- Uvula -->
                <ellipse cx="50" cy="68" rx="3" ry="5" fill="#FF6B6B"/>
                <!-- Tears flying back -->
                <path d="M25 42 Q15 45 5 42" stroke="#87CEEB" stroke-width="4" fill="none" opacity="0.8"/>
                <path d="M75 42 Q85 45 95 42" stroke="#87CEEB" stroke-width="4" fill="none" opacity="0.8"/>
            </svg>
        `;
    }

    createSplatFaceSVG(kidData) {
        const skinTone = kidData.skinTone || '#E8B89D';
        const hairColor = kidData.hairColor || '#1a1a1a';
        const noseColor = this.darkenColor(skinTone, 20);
        
        // Flattened face pressed against glass - LOONEY TUNES STYLE
        return `
            <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 5px 15px rgba(0,0,0,0.4));">
                <!-- Face (flattened oval, wider than tall) -->
                <ellipse cx="100" cy="75" rx="85" ry="55" fill="${skinTone}"/>
                
                <!-- Hair (squished on top) -->
                <ellipse cx="100" cy="30" rx="80" ry="20" fill="${hairColor}"/>
                <path d="M30 35 Q20 25 25 15" stroke="${hairColor}" stroke-width="8" fill="none"/>
                <path d="M170 35 Q180 25 175 15" stroke="${hairColor}" stroke-width="8" fill="none"/>
                
                <!-- Squished nose pressed flat (like against glass) -->
                <ellipse cx="100" cy="75" rx="25" ry="15" fill="${noseColor}" opacity="0.7"/>
                <ellipse cx="100" cy="80" rx="18" ry="8" fill="${noseColor}" opacity="0.5"/>
                <!-- Nostril marks -->
                <ellipse cx="90" cy="82" rx="5" ry="3" fill="${this.darkenColor(skinTone, 40)}"/>
                <ellipse cx="110" cy="82" rx="5" ry="3" fill="${this.darkenColor(skinTone, 40)}"/>
                
                <!-- Eyes (squished wide, looking dazed) -->
                <ellipse cx="55" cy="60" rx="22" ry="18" fill="white" stroke="#333" stroke-width="1"/>
                <ellipse cx="145" cy="60" rx="22" ry="18" fill="white" stroke="#333" stroke-width="1"/>
                <!-- Spiral/dazed pupils -->
                <g class="dazed-eye-left">
                    <circle cx="55" cy="62" r="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="55" cy="62" r="4" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="55" cy="62" r="1" fill="#1a1a1a"/>
                </g>
                <g class="dazed-eye-right">
                    <circle cx="145" cy="62" r="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="145" cy="62" r="4" fill="none" stroke="#1a1a1a" stroke-width="2"/>
                    <circle cx="145" cy="62" r="1" fill="#1a1a1a"/>
                </g>
                
                <!-- Eyebrows (squished up) -->
                <path d="M35 42 Q55 35 75 45" stroke="${hairColor}" stroke-width="4" fill="none"/>
                <path d="M165 42 Q145 35 125 45" stroke="${hairColor}" stroke-width="4" fill="none"/>
                
                <!-- Cheeks (squished out to sides) -->
                <ellipse cx="25" cy="75" rx="15" ry="20" fill="${skinTone}"/>
                <ellipse cx="175" cy="75" rx="15" ry="20" fill="${skinTone}"/>
                <ellipse cx="30" cy="78" rx="10" ry="8" fill="#FFB6C1" opacity="0.6"/>
                <ellipse cx="170" cy="78" rx="10" ry="8" fill="#FFB6C1" opacity="0.6"/>
                
                <!-- Mouth (squished wide, teeth showing) -->
                <ellipse cx="100" cy="110" rx="35" ry="20" fill="#2d0000"/>
                <!-- Teeth (pressed against glass) -->
                <rect x="70" y="100" width="12" height="10" fill="white" rx="2"/>
                <rect x="84" y="98" width="12" height="12" fill="white" rx="2"/>
                <rect x="98" y="97" width="10" height="13" fill="white" rx="2"/>
                <rect x="110" y="98" width="12" height="12" fill="white" rx="2"/>
                <rect x="124" y="100" width="12" height="10" fill="white" rx="2"/>
                <!-- Tongue (pressed flat) -->
                <ellipse cx="100" cy="118" rx="20" ry="8" fill="#FF6B6B"/>
                
                <!-- Drool/spit (cartoon style) -->
                <path d="M75 128 Q70 140 75 155" stroke="#87CEEB" stroke-width="3" fill="none" opacity="0.7" class="drool"/>
                <path d="M125 128 Q130 145 125 160" stroke="#87CEEB" stroke-width="3" fill="none" opacity="0.7" class="drool"/>
                
                <!-- Impact stars -->
                <g class="impact-stars">
                    <polygon points="15,20 20,35 35,35 23,45 28,60 15,50 2,60 7,45 -5,35 10,35" fill="#FFD700" opacity="0.9"/>
                    <polygon points="185,25 188,35 198,35 190,42 193,52 185,46 177,52 180,42 172,35 182,35" fill="#FFD700" opacity="0.9"/>
                    <polygon points="25,115 28,122 35,122 30,127 32,135 25,130 18,135 20,127 15,122 22,122" fill="#FFD700" opacity="0.8"/>
                    <polygon points="175,110 178,118 186,118 180,124 183,132 175,126 167,132 170,124 164,118 172,118" fill="#FFD700" opacity="0.8"/>
                </g>
                
                <!-- Tears (squished sideways) -->
                <path d="M30 55 Q15 60 5 50" stroke="#87CEEB" stroke-width="5" fill="none" opacity="0.8"/>
                <path d="M170 55 Q185 60 195 50" stroke="#87CEEB" stroke-width="5" fill="none" opacity="0.8"/>
            </svg>
        `;
    }
    
    darkenColor(hex, percent) {
        // Simple color darkening
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
    
    addWobbleEffect() {
        // Cartoon jello wobble when stuck to glass
        if (!this.splatFace) return;
        
        let wobbleCount = 0;
        const wobble = () => {
            if (wobbleCount >= 6 || !this.splatFace) return;
            
            const intensity = 1 - (wobbleCount / 6);
            const scaleX = 1 + (Math.sin(wobbleCount * Math.PI) * 0.05 * intensity);
            const scaleY = 0.85 + (Math.cos(wobbleCount * Math.PI) * 0.03 * intensity);
            const rotate = Math.sin(wobbleCount * Math.PI * 2) * 2 * intensity;
            
            this.splatFace.style.transition = 'transform 0.1s ease-out';
            this.splatFace.style.transform = `translate(-50%, -50%) scale(${scaleX}, ${scaleY}) rotate(${rotate}deg)`;
            
            wobbleCount++;
            setTimeout(wobble, 100);
        };
        wobble();
    }

    startSlideDown() {
        if (!this.splatFace) return;
        
        // Create squeaky slide sound effect
        this.playSqueekySlide();
        
        // Add drool trails
        this.createDroolTrails();
        
        // Slow slide down with slight rotation (like peeling off glass)
        this.splatFace.style.transition = 'all 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.splatFace.style.top = '130%';
        this.splatFace.style.transform = 'translate(-50%, -50%) scale(0.9) scaleY(1.1) rotate(-15deg)';
        this.splatFace.style.opacity = '0.8';
        
        // Also slide the smear
        this.smearOverlay.style.transition = 'all 1.8s ease-in';
        this.smearOverlay.style.transform = 'translateY(100%)';
    }
    
    createDroolTrails() {
        // Create cartoon drool/slime trails as face slides down
        for (let i = 0; i < 3; i++) {
            const drool = document.createElement('div');
            drool.className = 'drool-trail';
            drool.style.cssText = `
                position: absolute;
                left: ${40 + i * 15}%;
                top: 50%;
                width: 15px;
                height: 0;
                background: linear-gradient(to bottom, rgba(135, 206, 235, 0.6), rgba(135, 206, 235, 0.2));
                border-radius: 0 0 50% 50%;
                z-index: 150;
            `;
            this.container.appendChild(drool);
            this.droolElements.push(drool);
            
            // Animate drool extending
            setTimeout(() => {
                drool.style.transition = 'height 1.5s ease-in';
                drool.style.height = '40vh';
            }, 100 + i * 150);
        }
    }
    
    playSqueekySlide() {
        // Use oscillator for squeaky glass sound
        if (typeof sounds !== 'undefined' && sounds.audioContext) {
            const ctx = sounds.audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.5);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 1.5);
        }
    }

    shakeScreen(intensity = 10) {
        const container = document.getElementById('game-container') || document.body;
        container.style.setProperty('--shake-intensity', `${intensity}px`);
        container.classList.add('launch-shake');
        setTimeout(() => container.classList.remove('launch-shake'), 500);
    }

    playImpactSound() {
        // Use the game's sound manager if available
        if (typeof sounds !== 'undefined' && sounds.playImpact) {
            sounds.playImpact(2.5); // Extra strong impact
        }
    }

    cleanup() {
        if (this.kidElement) {
            this.kidElement.remove();
            this.kidElement = null;
        }
        if (this.splatFace) {
            this.splatFace.remove();
            this.splatFace = null;
        }
        this.droolElements.forEach(el => el.remove());
        this.droolElements = [];
        this.crackOverlay.classList.remove('visible');
        this.smearOverlay.classList.remove('visible');
        this.smearOverlay.style.transform = '';
        this.container.style.display = 'none';
        this.isLaunching = false;
    }
}

// Global instance
const kidLauncher = new KidLauncher();
