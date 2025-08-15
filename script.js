class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v5.0";
        this.systemName = "Just A Rather Very Intelligent System";
        this.isProcessing = false;
        this.isListening = false;
        this.conversationHistory = [];
        
        // Voice system
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.voices = [];
        
        // Initialize system
        this.initialize();
    }

    async initialize() {
        console.log(`🤖 Initializing ${this.systemName} v5.0...`);
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.initializeVoiceSystem();
            await this.testBackendConnection();
            this.displayWelcomeMessage();
            this.updateSystemStatus("JARVIS Online", "Backend Connected");
            console.log("✅ JARVIS Ultimate System Operational");
        } catch (error) {
            console.error("❌ System initialization failed:", error);
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
            recordBtn: document.getElementById('recordBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            statusText: document.getElementById('statusText'),
            apiStatus: document.getElementById('apiStatus'),
            voiceIndicator: document.getElementById('jarvisVoiceIndicator')
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
        this.elements.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        this.elements.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        this.elements.recordBtn.addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processUserMessage();
            }
        });

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                this.elements.messageInput.value = message;
                this.autoResizeTextarea();
                this.processUserMessage();
            });
        });
    }

    initializeVoiceSystem() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.elements.recordBtn.classList.add('recording');
                this.elements.voiceIndicator.classList.add('listening');
                this.updateSystemStatus("Listening...", "Voice input active");
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0].transcript;
                this.elements.messageInput.value = transcript;
                this.autoResizeTextarea();
                setTimeout(() => this.processUserMessage(), 500);
            };

            this.recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                this.resetVoiceButton();
            };

            this.recognition.onend = () => {
                this.resetVoiceButton();
            };
        } else {
            this.elements.recordBtn.style.display = 'none';
        }

        if (this.synthesis) {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
                console.log("🎤 Voice synthesis ready");
            };
            
            this.synthesis.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
    }

    async testBackendConnection() {
        try {
            console.log("🔍 Testing backend connection...");
            const response = await fetch('/api/health');
            
            if (response.ok) {
                const data = await response.json();
                console.log("✅ Backend connection successful:", data);
                this.updateSystemStatus("Connected", `${data.apis_configured || 'Multiple'} APIs ready`);
            } else {
                throw new Error("Backend not responding properly");
            }
        } catch (error) {
            console.error("❌ Backend connection failed:", error);
            this.updateSystemStatus("Backend offline", "API services unavailable");
            throw new Error("Cannot connect to backend. Please check deployment.");
        }
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        const maxHeight = 200;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
    }

    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText || this.isProcessing;
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error("Speech start error:", error);
            }
        }
    }

    resetVoiceButton() {
        this.isListening = false;
        this.elements.recordBtn.classList.remove('recording');
        this.elements.voiceIndicator.classList.remove('listening');
        this.updateSystemStatus("JARVIS Ready", "Voice input ready");
    }

    async processUserMessage() {
        if (this.isProcessing) return;

        const message = this.elements.messageInput.value.trim();
        if (!message) {
            this.elements.messageInput.focus();
            return;
        }

        this.isProcessing = true;
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = '54px';
        this.updateSendButton();

        this.addMessage(message, 'user');
        this.showTypingIndicator();
        this.updateSystemStatus("Processing...", "AI thinking...");

        try {
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: Date.now()
            });

            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            const response = await this.getAIResponse(message);
            
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            });

            this.hideTypingIndicator();
            this.addMessage(response.text, 'jarvis', true);
            this.updateSystemStatus("Response complete", `via ${response.provider}`);

        } catch (error) {
            console.error("❌ Error processing message:", error);
            this.hideTypingIndicator();
            
            let errorMessage = "I'm experiencing technical difficulties. ";
            if (error.message.includes("backend")) {
                errorMessage += "The backend services are currently unavailable. Please try again later.";
            } else {
                errorMessage += "Please check your connection and try again.";
            }
            
            this.addMessage(errorMessage, 'jarvis');
            this.updateSystemStatus("Error occurred", "System recovery");
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => {
                this.elements.messageInput.focus();
            }, 100);
        }
    }

    async getAIResponse(message) {
        try {
            console.log("📡 Sending request to backend...");
            
            const isTestRequest = this.isTestGenerationRequest(message);
            const endpoint = isTestRequest ? '/api/test-generator' : '/api/chat';
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: this.conversationHistory.slice(-6),
                    requestType: isTestRequest ? 'test-generation' : 'conversation'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(`Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            return {
                text: data.response || "I apologize, but I couldn't generate a response. Please try again.",
                provider: data.provider || "Unknown"
            };

        } catch (error) {
            console.error("❌ API call failed:", error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error("Cannot connect to backend server. Please check deployment status.");
            }
            throw error;
        }
    }

    isTestGenerationRequest(message) {
        const testKeywords = [
            'test', 'quiz', 'exam', 'practice', 'questions', 'mcq', 'assessment',
            'generate test', 'create quiz', 'practice questions', 'mock test'
        ];
        
        const messageLower = message.toLowerCase();
        return testKeywords.some(keyword => messageLower.includes(keyword));
    }

    addMessage(content, sender, withSpeaker = false) {
        const messagesContainer = this.elements.messagesContainer;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.innerHTML = `<strong>👤 You:</strong> ${this.escapeHTML(content)}`;
        } else {
            messageContent.innerHTML = this.formatAIContent(content);
            
            if (withSpeaker) {
                const speakerIcon = document.createElement('div');
                speakerIcon.className = 'speaker-icon';
                speakerIcon.innerHTML = '🔊';
                speakerIcon.title = 'Click to hear response';
                speakerIcon.addEventListener('click', () => {
                    this.speakText(content);
                });
                messageContent.appendChild(speakerIcon);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatAIContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        const messagesContainer = this.elements.messagesContainer;
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 150);
    }

    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }

    updateSystemStatus(status, info) {
        this.elements.statusText.textContent = status;
        if (this.elements.apiStatus && info) {
            this.elements.apiStatus.textContent = info;
        }
    }

    speakText(text) {
        if (!this.synthesis) return;
        
        const cleanText = text
            .replace(/<[^>]*>/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/[🤖📚📊🌱🏛️⚡🌍📖🔍💡✅❌⚠️🎯🚀🌟💎]/g, '')
            .substring(0, 500);
        
        if (cleanText.length < 10) return;
        
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        utterance.pitch = 0.8;
        
        const preferredVoices = this.voices.filter(voice => 
            voice.name.toLowerCase().includes('microsoft') ||
            voice.name.toLowerCase().includes('google') ||
            voice.lang.includes('en-US')
        );
        
        if (preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
        }
        
        this.elements.voiceIndicator.classList.add('speaking');
        
        utterance.onend = () => {
            this.elements.voiceIndicator.classList.remove('speaking');
        };
        
        utterance.onerror = () => {
            this.elements.voiceIndicator.classList.remove('speaking');
        };
        
        this.synthesis.speak(utterance);
    }

    displayWelcomeMessage() {
        console.log("👋 Welcome message displayed");
    }

    handleInitializationError(error) {
        console.error("Initialization error:", error);
        
        const errorHtml = `
            <div style="
                padding: 2rem; 
                color: #ff6b6b; 
                font-family: 'Inter', sans-serif; 
                text-align: center;
                background: var(--card-bg);
                border-radius: 1rem;
                border: 1px solid #ff6b6b;
                margin: 2rem;
            ">
                <h1>🚨 JARVIS Initialization Error</h1>
                <p style="margin: 1rem 0; color: var(--text-secondary);">
                    ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    background: var(--primary-gradient);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 0.75rem;
                    cursor: pointer;
                    font-size: 1rem;
                    margin-top: 1rem;
                ">
                    🔄 Restart JARVIS
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }
}

// Initialize JARVIS when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jarvis = new JarvisAIUltimate();
    });
} else {
    window.jarvis = new JarvisAIUltimate();
}

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

console.log(`
🤖 ═══════════════════════════════════════════════════
   JARVIS AI ULTIMATE - Clean Repository
   ═══════════════════════════════════════════════════
   🔵 Circle Arc Reactor Intro
   🎨 Perplexity-Style Interface  
   🧠 Multi-AI Backend Integration
   🔊 Selective Voice Responses
   📝 Advanced Test Generation
   🔐 Zero API Keys in Frontend
   ═══════════════════════════════════════════════════
`);
