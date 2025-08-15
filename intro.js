class JarvisReactorIntro {
    constructor() {
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
        
        this.startIntro();
    }

    async startIntro() {
        console.log("🔵 JARVIS Arc Reactor Initialization Starting...");
        
        // Generate reactor sounds
        this.generateReactorAudio();
        
        // Start progress animation
        await this.animateProgress();
        
        // Complete initialization
        setTimeout(() => {
            this.completeInitialization();
        }, 1000);
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
            
            // Power up sound
            setTimeout(() => {
                const powerUpOsc = audioContext.createOscillator();
                const powerUpGain = audioContext.createGain();
                
                powerUpOsc.connect(powerUpGain);
                powerUpGain.connect(audioContext.destination);
                
                powerUpOsc.frequency.setValueAtTime(440, audioContext.currentTime);
                powerUpOsc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 2);
                powerUpOsc.type = 'sine';
                
                powerUpGain.gain.setValueAtTime(0, audioContext.currentTime);
                powerUpGain.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.5);
                powerUpGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);
                
                powerUpOsc.start();
                powerUpOsc.stop(audioContext.currentTime + 2);
            }, 3000);
            
        } catch (error) {
            console.log("Audio not available:", error);
        }
    }

    async animateProgress() {
        const statusText = document.getElementById('statusText');
        const progressFill = document.getElementById('progressFill');
        
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

    completeInitialization() {
        console.log("✅ Arc Reactor Initialization Complete");
        
        // Fade out and redirect
        document.body.style.transition = 'opacity 1s ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 1000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new JarvisReactorIntro();
});

// Auto-start after 2 seconds if no interaction
setTimeout(() => {
    if (!window.jarvisIntroStarted) {
        window.jarvisIntroStarted = true;
        new JarvisReactorIntro();
    }
}, 2000);
