// ========================================
// ADDITIONAL LEVELS DATA - Levels 31-40
// Created in a separate file to reduce game.js complexity
// ========================================

// NEW LEVELS 31-40 - Unique Indian household themes
const EXTRA_LEVELS = [
    { name: "Puja Room Chaos", desc: "You blew out the sacred diya!" },
    { name: "Geyser Forgotten", desc: "Hot water for 3 hours?!" },
    { name: "Garden Destruction", desc: "Mummy's tulsi plant is broken!" },
    { name: "Guest WiFi", desc: "Changed the password during guests!" },
    { name: "Diwali Crackers", desc: "Burning the carpet with fuljhadi!" },
    { name: "Milk Overflow", desc: "The doodh is all over the stove!" },
    { name: "Relative's Phone", desc: "You broke Chacha's new phone!" },
    { name: "Wedding Prep", desc: "Ate the barfi before mehendi!" },
    { name: "Morning Temple", desc: "Overslept and missed darshan!" },
    { name: "Final Reckoning", desc: "Papa AND Mummy together..." }
];

// NEW BACKGROUNDS 31-40 - Unique themed backgrounds
const EXTRA_LEVEL_BACKGROUNDS = [
    // 30: Puja Room Chaos - Spiritual yellow/orange
    { 
        wallColor: '#FFF8E1', floorColor: '#D7CCC8', 
        theme: 'puja_chaos', accent: '#FF6F00'
    },
    // 31: Geyser Forgotten - Bathroom blues
    { 
        wallColor: '#E1F5FE', floorColor: '#90A4AE', 
        theme: 'bathroom', accent: '#0288D1'
    },
    // 32: Garden Destruction - Outdoor green
    { 
        wallColor: '#E8F5E9', floorColor: '#689F38', 
        theme: 'garden_chaos', accent: '#2E7D32'
    },
    // 33: Guest WiFi - Modern living room
    { 
        wallColor: '#FAFAFA', floorColor: '#8B4513', 
        theme: 'living_tech', accent: '#7C4DFF'
    },
    // 34: Diwali Crackers - Festive night
    { 
        wallColor: '#1A237E', floorColor: '#311B92', 
        theme: 'diwali_night', accent: '#FFD600'
    },
    // 35: Milk Overflow - Kitchen morning
    { 
        wallColor: '#FFF3E0', floorColor: '#D7CCC8', 
        theme: 'kitchen_morning', accent: '#FFFDE7'
    },
    // 36: Relative's Phone - Guest room tension
    { 
        wallColor: '#FFEBEE', floorColor: '#8B4513', 
        theme: 'guest_tense', accent: '#D32F2F'
    },
    // 37: Wedding Prep - Festive pink/gold
    { 
        wallColor: '#FCE4EC', floorColor: '#D7CCC8', 
        theme: 'wedding_prep', accent: '#AD1457'
    },
    // 38: Morning Temple - Dawn sacred
    { 
        wallColor: '#FFECB3', floorColor: '#A1887F', 
        theme: 'temple_morning', accent: '#E65100'
    },
    // 39: Final Reckoning - Ultimate boss
    { 
        wallColor: '#1B0000', floorColor: '#2d1810', 
        theme: 'ultimate_boss', accent: '#B71C1C'
    }
];

// NEW STORIES 31-40 - Authentic Indian scenarios
const EXTRA_LEVEL_STORIES = [
    // ============ LEVEL 31: Puja Room Chaos ============
    {
        title: 'The Sacred Disaster',
        panels: [
            {
                scene: 'puja_room',
                narration: 'During evening aarti...',
                mummyExpression: 'praying',
                kidExpression: 'bored',
                dialogue: { speaker: 'mummy', text: 'Stand still and fold your hands!' }
            },
            {
                scene: 'phone_distraction',
                mummyExpression: 'praying',
                kidExpression: 'distracted',
                dialogue: { speaker: 'kid', text: '*checking notification*' },
                effect: 'phone_glow'
            },
            {
                scene: 'diya_knocked',
                mummyExpression: 'horror',
                kidExpression: 'panicking',
                dialogue: { speaker: 'mummy', text: 'YOU KNOCKED OVER THE DIYA!' },
                effect: 'fire_panic',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 32: Geyser Forgotten ============
    {
        title: 'The Electric Bill Nightmare',
        panels: [
            {
                scene: 'bathroom_morning',
                narration: 'That morning before school...',
                mummyExpression: 'instructing',
                kidExpression: 'sleepy',
                dialogue: { speaker: 'mummy', text: 'Turn OFF the geyser after 10 minutes!' }
            },
            {
                scene: 'gaming_distraction',
                mummyExpression: 'suspicious',
                kidExpression: 'gaming',
                dialogue: { speaker: 'kid', text: 'Just one more match...' },
                effect: 'clock_spin'
            },
            {
                scene: 'geyser_discovery',
                mummyExpression: 'rage',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'THREE HOURS?! Water is BOILING! Bill will be ₹3000!' },
                effect: 'steam_explosion',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 33: Garden Destruction ============
    {
        title: 'Mummy\'s Pride & Joy',
        panels: [
            {
                scene: 'garden',
                narration: 'The sacred tulsi and rose garden...',
                mummyExpression: 'happy',
                kidExpression: 'playing',
                dialogue: { speaker: 'mummy', text: 'DON\'T play near my plants!' }
            },
            {
                scene: 'football_crash',
                mummyExpression: 'shock',
                kidExpression: 'frozen',
                effect: 'pot_breaking'
            },
            {
                scene: 'plants_destroyed',
                mummyExpression: 'heartbroken_rage',
                kidExpression: 'hiding',
                dialogue: { speaker: 'mummy', text: 'MY TULSI! I raised it for 5 YEARS! It was like my CHILD!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 34: Guest WiFi ============
    {
        title: 'The Password Betrayal',
        panels: [
            {
                scene: 'living_room',
                narration: 'Relatives visiting from out of town...',
                mummyExpression: 'hosting',
                kidExpression: 'annoyed',
                dialogue: { speaker: 'guest', text: 'Beta, WiFi password kya hai?' }
            },
            {
                scene: 'password_change',
                mummyExpression: 'chatting',
                kidExpression: 'scheming',
                dialogue: { speaker: 'kid', text: '*secretly changes password*' },
                effect: 'phone_click'
            },
            {
                scene: 'caught',
                mummyExpression: 'rage',
                kidExpression: 'caught',
                dialogue: { speaker: 'mummy', text: 'You changed it so they can\'t use it?! ATITHI DEVO BHAVA!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 35: Diwali Crackers ============
    {
        title: 'The Burning Carpet',
        panels: [
            {
                scene: 'diwali_night',
                narration: 'Diwali celebration in the drawing room...',
                mummyExpression: 'festive',
                kidExpression: 'excited',
                dialogue: { speaker: 'mummy', text: 'Light fuljhadi OUTSIDE only!' }
            },
            {
                scene: 'indoor_sparkler',
                mummyExpression: 'distracted',
                kidExpression: 'mischievous',
                dialogue: { speaker: 'kid', text: 'Just one inside...' },
                effect: 'sparkles'
            },
            {
                scene: 'carpet_burn',
                mummyExpression: 'horror_rage',
                kidExpression: 'panicking',
                dialogue: { speaker: 'mummy', text: 'THE PERSIAN CARPET! IT COST ₹50,000!' },
                effect: 'smoke',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 36: Milk Overflow ============
    {
        title: 'The Dudh Disaster',
        panels: [
            {
                scene: 'kitchen_morning',
                narration: 'Early morning chai preparation...',
                mummyExpression: 'instructing',
                kidExpression: 'sleepy',
                dialogue: { speaker: 'mummy', text: 'Watch the milk! Don\'t let it boil over!' }
            },
            {
                scene: 'cartoon_distraction',
                mummyExpression: 'showering',
                kidExpression: 'watching_tv',
                dialogue: { speaker: 'kid', text: 'Doraemon is on...' },
                effect: 'tv_glow'
            },
            {
                scene: 'milk_everywhere',
                mummyExpression: 'rage',
                kidExpression: 'panicking',
                dialogue: { speaker: 'mummy', text: 'THE MILK! It\'s ALL OVER the stove! Half liter WASTED!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 37: Relative's Phone ============
    {
        title: 'Chacha\'s New iPhone',
        panels: [
            {
                scene: 'guest_room',
                narration: 'Chacha showing off his new phone...',
                mummyExpression: 'happy',
                kidExpression: 'curious',
                dialogue: { speaker: 'chacha', text: 'See beta, iPhone 15! ₹1,50,000!' }
            },
            {
                scene: 'phone_playing',
                mummyExpression: 'chatting',
                kidExpression: 'playing',
                dialogue: { speaker: 'kid', text: 'Can I play one game?' }
            },
            {
                scene: 'phone_dropped',
                mummyExpression: 'horror',
                kidExpression: 'terrified',
                dialogue: { speaker: 'mummy', text: 'THE SCREEN IS CRACKED! How will we FACE them now?!' },
                effect: 'crack_sound',
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 38: Wedding Prep ============
    {
        title: 'The Mithai Thief',
        panels: [
            {
                scene: 'wedding_prep',
                narration: 'Bhabhi\'s mehendi ceremony preparations...',
                mummyExpression: 'decorating',
                kidExpression: 'eyeing_sweets',
                dialogue: { speaker: 'mummy', text: 'The barfi is for GUESTS! Don\'t TOUCH!' }
            },
            {
                scene: 'kitchen_sneak',
                mummyExpression: 'busy',
                kidExpression: 'sneaking',
                dialogue: { speaker: 'kid', text: 'Just one piece...' },
                effect: 'tiptoe'
            },
            {
                scene: 'box_empty',
                mummyExpression: 'ultimate_rage',
                kidExpression: 'guilty_sugar_lips',
                dialogue: { speaker: 'mummy', text: 'YOU ATE THE WHOLE BOX! ₹5000 worth! GUESTS ARE COMING!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 39: Morning Temple ============
    {
        title: 'The Missed Darshan',
        panels: [
            {
                scene: 'dawn',
                narration: 'Ekadashi morning, 4:30 AM...',
                mummyExpression: 'waking',
                kidExpression: 'sleeping',
                dialogue: { speaker: 'mummy', text: 'Wake UP! Temple darshan at 5!' }
            },
            {
                scene: 'snooze',
                mummyExpression: 'getting_ready',
                kidExpression: 'sleeping_deeply',
                dialogue: { speaker: 'kid', text: 'Just 5 more minutes...' },
                effect: 'zzz'
            },
            {
                scene: 'late',
                mummyExpression: 'rage',
                kidExpression: 'groggy',
                dialogue: { speaker: 'mummy', text: 'The temple CLOSED! We missed the special AARTI! Bhagwan will be ANGRY!' },
                chappalReady: true
            }
        ]
    },

    // ============ LEVEL 40: Final Reckoning ============
    {
        title: 'The Ultimate Judgement',
        panels: [
            {
                scene: 'evening',
                narration: 'Papa returns from office trip...',
                mummyExpression: 'complaining',
                kidExpression: 'nervous',
                dialogue: { speaker: 'mummy', text: 'You won\'t BELIEVE what your beta did this week!' }
            },
            {
                scene: 'list_reading',
                mummyExpression: 'listing',
                kidExpression: 'sinking',
                dialogue: { speaker: 'papa', text: 'Broken phone, burnt carpet, missed temple, ate sweets...' },
                effect: 'doom_list'
            },
            {
                scene: 'united_parents',
                mummyExpression: 'ultimate_rage',
                kidExpression: 'cornered',
                dialogue: { speaker: 'mummy', text: 'Both of us. Together. TWO CHAPPALS!' },
                effect: 'double_chappal',
                chappalReady: true
            }
        ]
    }
];

// ========================================
// EXTEND THE BASE ARRAYS (called after game.js loads)
// ========================================

// This function is called on page load to merge new levels
function extendLevelData() {
    // Extend LEVELS array
    if (typeof LEVELS !== 'undefined') {
        LEVELS.push(...EXTRA_LEVELS);
        console.log('✓ Extended LEVELS with', EXTRA_LEVELS.length, 'new levels. Total:', LEVELS.length);
    }
    
    // Extend LEVEL_BACKGROUNDS array
    if (typeof LEVEL_BACKGROUNDS !== 'undefined') {
        LEVEL_BACKGROUNDS.push(...EXTRA_LEVEL_BACKGROUNDS);
        console.log('✓ Extended LEVEL_BACKGROUNDS. Total:', LEVEL_BACKGROUNDS.length);
    }
    
    // Extend LEVEL_STORIES array
    if (typeof LEVEL_STORIES !== 'undefined') {
        LEVEL_STORIES.push(...EXTRA_LEVEL_STORIES);
        console.log('✓ Extended LEVEL_STORIES. Total:', LEVEL_STORIES.length);
    }
    
    // IMPORTANT: Rebuild level grid to show new levels 31-40
    if (typeof game !== 'undefined' && game.initLevelGrid) {
        game.initLevelGrid();
        console.log('✓ Rebuilt level grid to include new levels');
    }
}

// Auto-run when script loads (after game.js)
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure game.js arrays AND game object are defined
    setTimeout(extendLevelData, 200);
});
