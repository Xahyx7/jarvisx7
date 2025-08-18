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
            this.setupImageApiSelector();
            this.initializeVoiceSystem();
            this.initializeSpeechRecognition();
            this.updateSystemStatus("JARVIS v7.2 Online", "Foundation Intelligence Ready");
            console.log("✅ JARVIS v7.2 Foundation Intelligence Active");
        } catch (error) {
            console.error("❌ Initialization failed:", error);
            this.handleInitializationError(error);
        }
    }

    async waitForDOM() {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
    }

    initializeUIElements() {
        this.elements = {
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            messageForm: document.getElementById('messageForm'),
            sendBtn: document.getElementById('sendBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            statusText: document.getElementById('statusText'),
            apiStatus: document.getElementById('apiStatus')
        };

        const missingElements = [];
        for (const [name, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(name);
            }
        }

        if (missingElements.length > 0) {
            throw new Error(`Missing UI elements: ${missingElements.join(', ')}`);
        }
    }

    setupEventListeners() {
        // Form submission
        this.elements.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        // Send button
        this.elements.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        // Input handling
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processUserMessage();
            }
            
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.startVoiceRecognition();
            }
        });
    }

    // NEW: Setup mode selection with image intro message
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
            "🎨 **Image Generation Mode Activated!**\n\n" +
            "You have 3 powerful options:\n\n" +
            "1. 🎨 Pollinations - Artistic images, unlimited free\n" +
            "2. 🤖 Hugging Face - High-quality AI diagrams\n" +
            "3. 📊 Kroki - Precise technical diagrams & flowcharts\n\n" +
            "**Select your preferred style** from the buttons above, then describe what you want to generate!",
            'jarvis'
        );
    }

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

    async processUserMessage() {
        if (this.isProcessing) return;

        const message = this.elements.messageInput.value.trim();
        if (!message) {
            this.elements.messageInput.focus();
            return;
        }

        this.isProcessing = true;

        setTimeout(() => {
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = '54px';
            this.updateSendButton();
        }, 100);

        this.addMessage(message, 'user');
        this.showTypingIndicator();
        this.updateSystemStatus(`Processing in ${this.currentMode} mode...`, "Please wait");

        try {
            this.conversationHistory.push({ role: 'user', content: message, timestamp: Date.now() });
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            const response = await this.getResponseBasedOnMode(message);
            this.conversationHistory.push({ role: 'assistant', content: response.text, timestamp: Date.now() });

            this.hideTypingIndicator();
            this.addMessage(response.text, 'jarvis', true, response.provider);
            this.updateSystemStatus("Response complete", `via ${response.provider}`);

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'jarvis');
            this.updateSystemStatus("Error", error.message);
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => { this.elements.messageInput.focus(); }, 100);
        }
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

    addMessage(content, sender, withSpeaker = false, provider = '') {
        const messagesContainer = this.elements.messagesContainer;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.textContent = content;
        } else {
            messageContent.innerHTML = content;
            
            if (provider) {
                const providerInfo = document.createElement('div');
                providerInfo.className = 'provider-info';
                providerInfo.innerHTML = `<small>Provider: ${provider}</small>`;
                messageDiv.appendChild(providerInfo);
            }
            
            if (withSpeaker) {
                const speakerIcon = document.createElement('button');
                speakerIcon.className = 'speaker-icon';
                speakerIcon.textContent = '🔊 Speak';
                speakerIcon.title = 'Click to hear response';
                speakerIcon.onclick = (e) => {
                    e.preventDefault();
                    this.speakText(content);
                };
                messageDiv.appendChild(speakerIcon);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            const messagesContainer = this.elements.messagesContainer;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    updateSystemStatus(status, info) {
        this.elements.statusText.textContent = status;
        if (this.elements.apiStatus && info) {
            this.elements.apiStatus.textContent = info;
        }
    }

    speakText(text) {
        if (!this.synthesis) return;
        const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 500);
        if (cleanText.length < 5) return;
        this.synthesis.cancel();
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.9;
            utterance.volume = 0.8;
            this.synthesis.speak(utterance);
        }, 100);
    }

    initializeVoiceSystem() {
        this.synthesis = window.speechSynthesis;
        if (this.synthesis) {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
            };
            this.synthesis.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                console.log('Voice recognition started');
                this.updateSystemStatus('Listening...', 'Speak your command');
                this.elements.messageInput.placeholder = '🎤 Listening...';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Voice input:', transcript);
                this.elements.messageInput.value = transcript;
                this.updateInputPlaceholder();
                this.autoResizeTextarea();
                this.updateSendButton();
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.updateInputPlaceholder();
                this.updateSystemStatus('Voice recognition failed', event.error);
            };

            this.recognition.onend = () => {
                this.updateInputPlaceholder();
                this.updateSystemStatus('Ready', 'Foundation Intelligence');
            };
        } else {
            console.warn('Web Speech API not supported');
        }
    }

    startVoiceRecognition() {
        if (this.recognition) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Voice recognition start error:', error);
            }
        }
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        const maxHeight = 150;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
    }

    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        const shouldEnable = hasText && !this.isProcessing;
        
        this.elements.sendBtn.disabled = !shouldEnable;
        
        if (this.isProcessing) {
            this.elements.sendBtn.textContent = 'Sending...';
        } else {
            this.elements.sendBtn.textContent = 'Send';
        }
    }

    handleInitializationError(error) {
        console.error(error);
        alert('JARVIS Initialization Error: ' + error.message);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jarvis = new JarvisAIUltimate();
    });
} else {
    window.jarvis = new JarvisAIUltimate();
}

console.log('🤖 JARVIS AI v7.2 Foundation Intelligence loaded and ready');
