class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v6.3-Fixed";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS Ultimate...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.initializeVoiceSystem();
            this.updateSystemStatus("JARVIS Online", "Ready for commands");
            console.log("✅ JARVIS System Active - All features operational");
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
            recordBtn: document.getElementById('recordBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            statusText: document.getElementById('statusText'),
            apiStatus: document.getElementById('apiStatus'),
            voiceIndicator: document.getElementById('jarvisVoiceIndicator')
        };

        const missingElements = [];
        for (const [name, element] of Object.entries(this.elements)) {
            if (!element && name !== 'recordBtn' && name !== 'voiceIndicator') { // These are optional
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
            this.processUserMessage('conversation');
        });

        // Send button
        this.elements.sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.processUserMessage('conversation');
        });

        // Input handling
        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
            this.updateSendButton();
        });

        this.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processUserMessage('conversation');
            }
        });

        // FIXED: Preset buttons with proper request type detection
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                const buttonText = btn.textContent.toLowerCase();
                
                // Auto-detect if this is a test generation request
                const isTestRequest = buttonText.includes('test') || 
                                    buttonText.includes('quiz') || 
                                    buttonText.includes('practice') ||
                                    message.toLowerCase().includes('test') ||
                                    message.toLowerCase().includes('quiz') ||
                                    message.toLowerCase().includes('generate');
                
                const requestType = isTestRequest ? 'test-generation' : 'conversation';
                
                this.elements.messageInput.value = message;
                this.autoResizeTextarea();
                this.processUserMessage(requestType);
            });
        });
    }

    initializeVoiceSystem() {
        // Voice recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            if (this.elements.recordBtn) {
                this.elements.recordBtn.addEventListener('click', () => {
                    this.toggleVoiceInput();
                });

                this.recognition.onstart = () => {
                    this.isListening = true;
                    this.elements.recordBtn.classList.add('recording');
                    if (this.elements.voiceIndicator) {
                        this.elements.voiceIndicator.classList.add('listening');
                    }
                };

                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    this.elements.messageInput.value = transcript;
                    this.autoResizeTextarea();
                    setTimeout(() => this.processUserMessage('conversation'), 500);
                };

                this.recognition.onend = () => {
                    this.isListening = false;
                    this.elements.recordBtn.classList.remove('recording');
                    if (this.elements.voiceIndicator) {
                        this.elements.voiceIndicator.classList.remove('listening');
                    }
                };
            }
        } else if (this.elements.recordBtn) {
            this.elements.recordBtn.style.display = 'none';
        }

        // Speech synthesis
        this.synthesis = window.speechSynthesis;
        if (this.synthesis) {
            const loadVoices = () => {
                this.voices = this.synthesis.getVoices();
            };
            this.synthesis.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error("Voice input error:", error);
            }
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

    async processUserMessage(requestType = 'conversation') {
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

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        this.updateSystemStatus("JARVIS thinking...", `Processing ${requestType}...`);

        try {
            // Add to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: Date.now()
            });

            // Keep history manageable
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            // Get AI response with retry logic
            const response = await this.getAIResponseWithRetry(message, requestType);
            
            // Add AI response to history (only for conversations, not tests)
            if (requestType === 'conversation') {
                this.conversationHistory.push({
                    role: 'assistant',
                    content: response.text,
                    timestamp: Date.now()
                });
            }

            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI message to chat
            this.addMessage(response.text, 'jarvis', true);
            
            // Update status
            this.updateSystemStatus("Response complete", `via ${response.provider}`);

        } catch (error) {
            console.error("❌ Error processing message:", error);
            this.hideTypingIndicator();
            
            // Show actual error - no fake messages
            this.addMessage(`❌ Error: ${error.message}`, 'jarvis');
            this.updateSystemStatus("Error", error.message);
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => {
                this.elements.messageInput.focus();
            }, 100);
        }
    }

    async getAIResponseWithRetry(message, requestType) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`📡 Attempt ${attempt}/${this.maxRetries} - Type: ${requestType}`);
                
                // Determine endpoint based on request type
                const endpoint = requestType === 'test-generation' ? '/api/test-generator' : '/api/chat';
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        history: this.conversationHistory.slice(-6)
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                    throw new Error(`${response.status}: ${errorData.error || errorData.detail || 'Unknown error'}`);
                }

                const data = await response.json();
                
                if (!data.response) {
                    throw new Error('No response from AI service');
                }

                console.log(`✅ Success on attempt ${attempt} - ${requestType}`);
                return {
                    text: data.response,
                    provider: data.provider || "Groq-Llama-3.3"
                };

            } catch (error) {
                console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    this.updateSystemStatus(`Retrying... (${attempt}/${this.maxRetries})`, "Please wait");
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        throw new Error(`Failed after ${this.maxRetries} attempts: ${lastError.message}`);
    }

    addMessage(content, sender, withSpeaker = false) {
        const messagesContainer = this.elements.messagesContainer;
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.innerHTML = `<strong>👤 You:</strong> ${this.escapeHTML(content)}`;
        } else {
            messageContent.innerHTML = this.formatAIContent(content);
            
            // Add speaker icon for JARVIS messages
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
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    formatAIContent(content) {
        // Enhanced formatting for AI responses
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
            .replace(/\n\n/g, '</p><p>') // Paragraphs
            .replace(/\n/g, '<br>') // Line breaks
            .replace(/^/, '<p>') // Start paragraph
            .replace(/$/, '</p>'); // End paragraph
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
        
        // Clean text for speech
        const cleanText = text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .replace(/[🤖📚📊🌱🏛️⚡🌍📖🔍💡✅❌⚠️🎯🚀🌟💎]/g, '') // Remove emojis
            .substring(0, 500); // Limit length
        
        if (cleanText.length < 10) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        utterance.pitch = 0.8;
        
        // Try to use a good voice
        const preferredVoices = this.voices?.filter(voice => 
            voice.name.toLowerCase().includes('microsoft') ||
            voice.name.toLowerCase().includes('google') ||
            voice.lang.includes('en-US')
        );
        
        if (preferredVoices && preferredVoices.length > 0) {
            utterance.voice = preferredVoices[0];
        }
        
        if (this.elements.voiceIndicator) {
            this.elements.voiceIndicator.classList.add('speaking');
        }
        
        utterance.onend = () => {
            if (this.elements.voiceIndicator) {
                this.elements.voiceIndicator.classList.remove('speaking');
            }
        };
        
        utterance.onerror = () => {
            if (this.elements.voiceIndicator) {
                this.elements.voiceIndicator.classList.remove('speaking');
            }
        };
        
        this.synthesis.speak(utterance);
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
                <p style="margin: 1rem 0;">
                    ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    background: linear-gradient(135deg, #4f7cff 0%, #00d4ff 100%);
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
   JARVIS AI ULTIMATE - Fixed Preset Buttons
   ═══════════════════════════════════════════════════
   🔵 Circle Arc Reactor Intro
   🎨 Perplexity-Style Interface  
   🧠 Groq Llama 3.3 70B (Both Chat & Test Generation)
   🔊 Voice Response System
   🔄 Retry Logic with Smart Request Detection
   ⚡ Fixed Preset Button Issues
   📝 Working Test Generation
   ═══════════════════════════════════════════════════
`);
