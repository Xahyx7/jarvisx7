class JarvisReactorIntro {
    constructor() {
        this.hasStarted = false; // Prevent multiple initializations
        this.currentPhase = 0;
        this.phases = [
            "Initializing Arc Reactor...",
            "Charging Power Core...",
            "Stabilizing Energy Field...",
            "Synchronizing Systems...",
            "Calibrating Interface...",
            "Loading AI Protocols...",
            "Establishing Connections...",
            "JARVIS Systems Online",
            "Initialization Complete"
        ];
        
        // Single initialization with safeguards
        this.startIntroSafely();
    }

    startIntroSafely() {
        // PREVENT INFINITE LOOP - Check if already started
        if (this.hasStarted) {
            console.log("⚠️ Intro already started, skipping...");
            return;
        }
        
        // PREVENT INFINITE LOOP - Set flag immediately
        this.hasStarted = true;
        window.jarvisIntroStarted = true;
        
        console.log("🔵 JARVIS Arc Reactor Initialization Starting...");
        
        // Start with delay to ensure DOM is ready
        setTimeout(() => {
            this.executeIntroSequence();
        }, 500);
    }

    async executeIntroSequence() {
        try {
            // Generate reactor sounds
            this.generateReactorAudio();
            
            // Start progress animation
            await this.animateProgress();
            
            // IMPORTANT: Complete initialization with timeout safety
            this.completeInitializationSafely();
            
        } catch (error) {
            console.error("Intro error:", error);
            // FALLBACK: Force redirect if something goes wrong
            this.forceRedirect();
        }
    }

    generateReactorAudio() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Reactor hum
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 1);
            gainNode.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 8);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 9);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 9);
            
        } catch (error) {
            console.log("Audio not available:", error);
        }
    }

    async animateProgress() {
        const statusText = document.getElementById('statusText');
        const progressFill = document.getElementById('progressFill');
        
        if (!statusText || !progressFill) {
            console.error("Missing intro elements, forcing redirect...");
            this.forceRedirect();
            return;
        }
        
        for (let i = 0; i < this.phases.length; i++) {
            // Update status text
            statusText.textContent = this.phases[i];
            
            // Update progress bar
            const progress = ((i + 1) / this.phases.length) * 100;
            progressFill.style.width = progress + '%';
            
            // Wait between phases
            const delay = i === this.phases.length - 1 ? 1500 : 800;
            await this.delay(delay);
        }
    }

    completeInitializationSafely() {
        console.log("✅ Arc Reactor Initialization Complete");
        
        // PREVENT INFINITE LOOP: Set completion flag
        window.jarvisIntroCompleted = true;
        
        // Multiple redirect methods for safety
        this.initiateRedirect();
        
        // BACKUP: Force redirect after 3 seconds if main redirect fails
        setTimeout(() => {
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname === '') {
                console.log("🔄 Backup redirect triggered");
                this.forceRedirect();
            }
        }, 3000);
    }

    initiateRedirect() {
        try {
            // Fade out effect
            document.body.style.transition = 'opacity 1s ease-out';
            document.body.style.opacity = '0';
            
            // Primary redirect after fade
            setTimeout(() => {
                this.performRedirect();
            }, 1000);
            
        } catch (error) {
            console.error("Redirect error:", error);
            this.forceRedirect();
        }
    }

    performRedirect() {
        try {
            // MULTIPLE REDIRECT METHODS for maximum compatibility
            
            // Method 1: Standard navigation
            if (typeof window.location.assign === 'function') {
                window.location.assign('main.html');
                return;
            }
            
            // Method 2: Direct href change
            if (window.location.href) {
                window.location.href = 'main.html';
                return;
            }
            
            // Method 3: Replace current page
            if (typeof window.location.replace === 'function') {
                window.location.replace('main.html');
                return;
            }
            
        } catch (error) {
            console.error("All redirect methods failed:", error);
            this.forceRedirect();
        }
    }

    forceRedirect() {
        // EMERGENCY REDIRECT: Multiple fallback methods
        console.log("🚨 Emergency redirect activated");
        
        try {
            // Try window.open as last resort
            const newWindow = window.open('main.html', '_self');
            if (!newWindow) {
                // If popup blocked, show manual link
                this.showManualRedirect();
            }
        } catch (error) {
            this.showManualRedirect();
        }
    }

    showManualRedirect() {
        // FINAL FALLBACK: Show clickable link
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: 'Orbitron', monospace;
                background: radial-gradient(circle at center, #001122 0%, #000000 100%);
                color: #00ffff;
                text-align: center;
            ">
                <h1 style="margin-bottom: 2rem;">🤖 JARVIS Ready</h1>
                <p style="margin-bottom: 2rem;">Initialization complete!</p>
                <a href="main.html" style="
                    background: linear-gradient(135deg, #4f7cff 0%, #00d4ff 100%);
                    color: white;
                    padding: 1rem 2rem;
                    text-decoration: none;
                    border-radius: 0.75rem;
                    font-weight: 600;
                    transition: transform 0.3s ease;
                " onmouseover="this.style.transform='scale(1.05)'" 
                   onmouseout="this.style.transform='scale(1)'">
                    🚀 Launch JARVIS Interface
                </a>
            </div>
        `;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// SAFE INITIALIZATION with multiple guards
document.addEventListener('DOMContentLoaded', () => {
    // PREVENT INFINITE LOOP: Check if already initialized
    if (window.jarvisIntroStarted) {
        console.log("⚠️ Intro already started, skipping DOMContentLoaded initialization");
        return;
    }
    
    new JarvisReactorIntro();
});

// BACKUP AUTO-START with safety checks
setTimeout(() => {
    if (!window.jarvisIntroStarted && !window.jarvisIntroCompleted) {
        console.log("🔄 Backup auto-start triggered");
        new JarvisReactorIntro();
    }
}, 3000);

// EMERGENCY REDIRECT if stuck on intro page for too long
setTimeout(() => {
    if (!window.jarvisIntroCompleted && 
        (window.location.pathname.includes('index.html') || 
         window.location.pathname === '/' || 
         window.location.pathname === '')) {
        console.log("🚨 Emergency timeout redirect");
        window.location.href = 'main.html';
    }
}, 15000); // 15 second safety net

// PAGE VISIBILITY: Redirect if user returns to tab
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.jarvisIntroCompleted) {
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' || 
            window.location.pathname === '') {
            console.log("🔄 Visibility change redirect");
            window.location.href = 'main.html';
        }
    }
});
