class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2-FoundationIntelligence";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.recognition = null;
        this.currentMode = 'chat';
        this.currentImageAPI = 'pollinations'; // Default image API
        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS v7.2 Foundation Intelligence...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.setupModeSelection();
            this.setupImageApiSelector(); // NEW
            this.initializeVoiceSystem();
            this.initializeSpeechRecognition();
            this.updateSystemStatus("JARVIS v7.2 Online", "Foundation Intelligence Ready");
            console.log("✅ JARVIS v7.2 Foundation Intelligence Active");
        } catch (error) {
            console.error("❌ Initialization failed:", error);
            this.handleInitializationError(error);
        }
    }

    // ... keep all your existing methods ...

    // NEW: Setup image API selector buttons
    setupImageApiSelector() {
        const apiButtons = document.querySelectorAll('#image-api-selector .api-btn');
        
        apiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all buttons
                apiButtons.forEach(b => b.classList.remove('active'));
                
                // Add active to clicked button
                btn.classList.add('active');
                
                // Update current API
                this.currentImageAPI = btn.getAttribute('data-api');
                
                // Show confirmation message
                this.addMessage(`🎨 Image generation API switched to: ${this.currentImageAPI}`, 'jarvis');
                console.log('Image API selected:', this.currentImageAPI);
            });
        });
    }

    // ENHANCED: Setup mode selection with image intro message
    setupModeSelection() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active from all items
                menuItems.forEach(i => i.classList.remove('active'));
                
                // Add active to clicked item
                item.classList.add('active');
                
                // Detect mode from text content
                const text = item.textContent.toLowerCase();
                if (text.includes('chat')) {
                    this.currentMode = 'chat';
                    this.updateSystemStatus("Chat Mode", "Groq API Ready");
                    document.getElementById('image-api-selector').style.display = 'none';
                } else if (text.includes('search')) {
                    this.currentMode = 'search';
                    this.updateSystemStatus("Search Mode", "Web Search Ready");
                    document.getElementById('image-api-selector').style.display = 'none';
                } else if (text.includes('image')) {
                    this.currentMode = 'image';
                    this.updateSystemStatus("Image Mode", "Image Generator Ready");
                    
                    // Show API selector and intro message
                    document.getElementById('image-api-selector').style.display = 'flex';
                    this.addImageIntroMessage();
                }
                
                console.log(`🎯 Mode switched to: ${this.currentMode}`);
                this.updateInputPlaceholder();
            });
        });
    }

    // NEW: Show intro message for image generation
    addImageIntroMessage() {
        this.addMessage(
            `🎨 **Image Generation Mode Activated!**\n\n` +
            `You have 3 powerful options:\n\n` +
            `1. **🎨 Pollinations** - Artistic images, unlimited free\n` +
            `2. **🤖 Hugging Face** - High-quality AI diagrams\n` +
            `3. **📊 Kroki** - Precise technical diagrams & flowcharts\n\n` +
            `**Select your preferred style** from the buttons above, then describe what you want to generate!`,
            'jarvis'
        );
    }

    // ENHANCED: Update placeholder based on mode and API
    updateInputPlaceholder() {
        let placeholder;
        
        if (this.currentMode === 'chat') {
            placeholder = "Ask JARVIS anything...";
        } else if (this.currentMode === 'search') {
            placeholder = "Search the web for latest information...";
        } else if (this.currentMode === 'image') {
            if (this.currentImageAPI === 'kroki') {
                placeholder = "Describe a diagram (e.g., 'flowchart for user login process')...";
            } else if (this.currentImageAPI === 'huggingface') {
                placeholder = "Describe the diagram or image you want to generate...";
            } else {
                placeholder = "Describe the image you want to create...";
            }
        } else {
            placeholder = "Message JARVIS...";
        }
        
        this.elements.messageInput.placeholder = placeholder;
    }

    // ENHANCED: Route to different image APIs
    async getResponseBasedOnMode(message) {
        let endpoint, task;
        
        if (this.currentMode === 'chat') {
            endpoint = '/api/chat';
            task = 'chat';
        } else if (this.currentMode === 'search') {
            endpoint = '/api/chat';
            task = 'search';
        } else if (this.currentMode === 'image') {
            task = 'image';
            // Route to different image endpoints based on selected API
            if (this.currentImageAPI === 'huggingface') {
                endpoint = '/api/image-huggingface';
            } else if (this.currentImageAPI === 'kroki') {
                endpoint = '/api/image-kroki';
            } else {
                endpoint = '/api/image-pollinations';
            }
        }

        console.log(`🎯 Using mode: ${this.currentMode}, API: ${this.currentImageAPI}, endpoint: ${endpoint}`);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    history: this.conversationHistory.slice(-6),
                    task: task
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            if (!data.response && !data.output_url) {
                throw new Error('No response from API');
            }

            // Handle different response types
            if (data.output_url) {
                // Image response
                return {
                    text: `🎨 Image generated successfully!\n\n![Generated Image](${data.output_url})`,
                    provider: data.provider || 'Image Generator'
                };
            } else {
                // Chat/Search response
                return {
                    text: data.response,
                    provider: data.provider || 'Unknown'
                };
            }

        } catch (error) {
            throw new Error(`${this.currentMode} processing failed: ${error.message}`);
        }
    }

    // ... keep all your other existing methods (addMessage, speakText, etc.) ...
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jarvis = new JarvisAIUltimate();
    });
} else {
    window.jarvis = new JarvisAIUltimate();
}

console.log('🤖 JARVIS AI v7.2 Foundation Intelligence loaded and ready');
