class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2-FoundationIntelligence";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.recognition = null;
        this.currentMode = 'chat'; // NEW: Track current mode
        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS v7.2 Foundation Intelligence...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.setupModeSelection(); // NEW: Setup mode switching
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

    // NEW: Setup mode selection
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
                } else if (text.includes('search')) {
                    this.currentMode = 'search';
                    this.updateSystemStatus("Search Mode", "Web Search Ready");
                } else if (text.includes('image')) {
                    this.currentMode = 'image';
                    this.updateSystemStatus("Image Mode", "Image Generator Ready");
                }
                
                console.log(`🎯 Mode switched to: ${this.currentMode}`);
                
                // Update placeholder based on mode
                this.updateInputPlaceholder();
            });
        });
    }

    updateInputPlaceholder() {
        const placeholders = {
            'chat': "Ask JARVIS anything...",
            'search': "Search the web for latest information...",
            'image': "Describe the image you want to generate..."
        };
        
        this.elements.messageInput.placeholder = placeholders[this.currentMode] || "Message JARVIS...";
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
        
        console.log('Send button update:', { hasText, isProcessing: this.isProcessing, shouldEnable });
        
        this.elements.sendBtn.disabled = !shouldEnable;
        
        if (this.isProcessing) {
            this.elements.sendBtn.textContent = 'Sending...';
        } else {
            this.elements.sendBtn.textContent = 'Send';
        }
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
            const response = await this.getResponseBasedOnMode(message);
            
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

    // NEW: Route based on current mode
    async getResponseBasedOnMode(message) {
        let endpoint, task;
        
        if (this.currentMode === 'chat') {
            endpoint = '/api/chat';
            task = 'chat';
        } else if (this.currentMode === 'search') {
            endpoint = '/api/chat'; // Use chat endpoint but force search detection
            task = 'search';
        } else if (this.currentMode === 'image') {
            endpoint = '/api/image';
            task = 'image';
        }

        console.log(`🎯 Using mode: ${this.currentMode}, endpoint: ${endpoint}`);

        // FIXED: Direct API calls instead of problematic retry logic
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
