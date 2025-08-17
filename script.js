class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2-FoundationIntelligence";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.recognition = null;
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS v7.2 Foundation Intelligence...");
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
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

        // FIXED: Input handling with proper send button updates
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton(); // CRITICAL: This enables/disables send button
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
                this.elements.messageInput.placeholder = 'Message JARVIS...';
                this.autoResizeTextarea();
                this.updateSendButton();
            };

            this.recognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.elements.messageInput.placeholder = 'Message JARVIS...';
                this.updateSystemStatus('Voice recognition failed', event.error);
            };

            this.recognition.onend = () => {
                this.elements.messageInput.placeholder = 'Message JARVIS...';
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

    // FIXED: Critical send button update function
    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        const shouldEnable = hasText && !this.isProcessing;
        
        // Debug logging
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

        // FIXED: Clear input with proper timing
        setTimeout(() => {
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = '54px';
            this.updateSendButton();
        }, 100);

        this.addMessage(message, 'user');
        this.showTypingIndicator();
        this.updateSystemStatus('JARVIS thinking...', 'Processing with AI...');

        try {
            this.conversationHistory.push({ role: 'user', content: message, timestamp: Date.now() });
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            const response = await this.getAIResponseWithRetry(message);
            this.conversationHistory.push({ role: 'assistant', content: response.text, timestamp: Date.now() });

            this.hideTypingIndicator();
            this.addMessage(response.text, 'jarvis', true, response.provider);
            this.updateSystemStatus('Response complete', `via ${response.provider}`);

        } catch (error) {
            console.error('Error processing message:', error);
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'jarvis');
            this.updateSystemStatus('Error', error.message);
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => { this.elements.messageInput.focus(); }, 100);
        }
    }

    async getAIResponseWithRetry(message) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message, history: this.conversationHistory.slice(-6) })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Unknown error');
                }

                const data = await response.json();
                if (!data.response) throw new Error('No response from AI');
                return { text: data.response, provider: data.provider || 'Unknown' };
            } catch (error) {
                lastError = error;
                await new Promise(r => setTimeout(r, this.retryDelay * attempt));
            }
        }
        throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
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
            
            // FIXED: Voice speaker button
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

    // FIXED: Voice synthesis
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
