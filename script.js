class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2-FoundationIntelligence";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.recognition = null; // For Web Speech API
        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS v7.2 Foundation Intelligence...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.initializeVoiceSystem();
            this.initializeSpeechRecognition(); // NEW: Web Speech API
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
            
            // NEW: Voice input shortcut (Ctrl + Space)
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.startVoiceRecognition();
            }
        });

        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                if (item.textContent.includes('Test Generator')) {
                    this.elements.messageInput.value = "Generate a comprehensive test for my subject";
                    this.elements.messageInput.focus();
                    this.autoResizeTextarea();
                }
            });
        });
    }

    initializeVoiceSystem() {
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

    // NEW: Web Speech API for voice input
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                console.log('🎤 Voice recognition started');
                this.updateSystemStatus("Listening...", "Speak your command");
                this.elements.messageInput.placeholder = "🎤 Listening...";
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0].transcript;
                console.log('🎤 Voice input:', transcript);
                this.elements.messageInput.value = transcript;
                this.elements.messageInput.placeholder = "Message JARVIS...";
                this.autoResizeTextarea();
                this.updateSendButton();
            };

            this.recognition.onerror = (event) => {
                console.error('🎤 Voice recognition error:', event.error);
                this.elements.messageInput.placeholder = "Message JARVIS...";
                this.updateSystemStatus("Voice recognition failed", event.error);
            };

            this.recognition.onend = () => {
                this.elements.messageInput.placeholder = "Message JARVIS...";
                this.updateSystemStatus("Ready", "Foundation Intelligence");
            };
        } else {
            console.warn('🎤 Web Speech API not supported');
        }
    }

    // NEW: Start voice recognition
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
        this.elements.sendBtn.disabled = !hasText || this.isProcessing;
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

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        this.updateSystemStatus("JARVIS thinking...", "Processing with AI...");

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

            // Get AI response through smart chat handler
            const response = await this.getAIResponseWithRetry(message);
            
            // Add AI response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            });

            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add AI message to chat with provider info
            this.addMessage(response.text, 'jarvis', true, response.provider);
            
            // Update status with provider info
            this.updateSystemStatus("Response complete", `via ${response.provider}`);

        } catch (error) {
            console.error("❌ Error processing message:", error);
            this.hideTypingIndicator();
            
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

    async getAIResponseWithRetry(message) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`📡 Attempt ${attempt}/${this.maxRetries} - Smart Chat`);
                
                const response = await fetch('/api/chat', {
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

                console.log(`✅ Success on attempt ${attempt} via ${data.provider}`);
                return {
                    text: data.response,
                    provider: data.provider || "Unknown Provider"
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

    addMessage(content, sender, withSpeaker = false, provider = '') {
        const messagesContainer = this.elements.messagesContainer;
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.innerHTML = this.escapeHTML(content);
        } else {
            messageContent.innerHTML = this.formatAIContent(content);
            
            // Add provider info for JARVIS messages
            if (provider) {
                const providerInfo = document.createElement('div');
                providerInfo.className = 'provider-info';
                providerInfo.innerHTML = `<small>📡 ${provider}</small>`;
                messageDiv.appendChild(providerInfo);
            }
            
            // FIXED: Add speaker icon for JARVIS messages
            if (withSpeaker) {
                const speakerIcon = document.createElement('button');
                speakerIcon.className = 'speaker-icon';
                speakerIcon.innerHTML = '🔊 Speak';
                speakerIcon.title = 'Click to hear response';
                speakerIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.speakText(content); // FIXED: Pass content directly
                });
                messageDiv.appendChild(speakerIcon);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        this.scrollToBottom();
    }

    formatAIContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background:#1a1a1a;padding:2px 4px;border-radius:4px;">$1</code>')
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
        setTimeout(() => {
            const messagesContainer = this.elements.messagesContainer;
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

    updateSystemStatus(status, info) {
        this.elements.statusText.textContent = status;
        if (this.elements.apiStatus && info) {
            this.elements.apiStatus.textContent = info;
        }
    }

    // FIXED: Voice synthesis function
    speakText(text) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return;
        }
        
        // Clean text for speech
        const cleanText = text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .replace(/[🤖📚📊🌱🏛️⚡🌍📖🔍💡✅❌⚠️🎯🚀🌟💎📡🔊]/g, '') // Remove emojis
            .substring(0, 500); // Limit length
        
        if (cleanText.length < 5) {
            console.warn('Text too short for speech');
            return;
        }
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        // Wait before starting new speech
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.9;
            utterance.volume = 0.8;
            utterance.pitch = 0.8;
            utterance.lang = 'en-US';
            
            // Use better voice if available
            if (this.voices && this.voices.length > 0) {
                const preferredVoice = this.voices.find(voice => 
                    voice.name.includes('Google') || 
                    voice.name.includes('Microsoft') ||
                    voice.lang.includes('en-US')
                );
                if (preferredVoice) {
                    utterance.voice = preferredVoice;
                }
            }
            
            utterance.onstart = () => {
                console.log('🔊 Speech synthesis started');
            };
            
            utterance.onend = () => {
                console.log('🔊 Speech synthesis finished');
            };
            
            utterance.onerror = (error) => {
                console.error('🔊 Speech synthesis error:', error);
            };
            
            this.synthesis.speak(utterance);
        }, 200); // Increased delay to ensure proper cleanup
    }

    handleInitializationError(error) {
        console.error("Initialization error:", error);
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f0f0f;color:#e5e7eb;font-family:Inter,sans-serif;">
                <div style="text-align:center;padding:2rem;">
                    <h1>🚨 JARVIS v7.2 Initialization Error</h1>
                    <p style="margin:1rem 0;">${error.message}</p>
                    <button onclick="location.reload()" style="background:#2563eb;color:white;border:none;padding:1rem 2rem;border-radius:0.5rem;cursor:pointer;">
                        🔄 Restart JARVIS
                    </button>
                </div>
            </div>
        `;
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

console.log(`
🤖 ═══════════════════════════════════════════════════
   JARVIS AI ULTIMATE v7.2 - Foundation Intelligence
   ═══════════════════════════════════════════════════
   🧠 DeepSeek + Groq Smart Fallback
   🔍 Web Search with Serper + Serpstack
   🔊 Fixed Voice Synthesis + Web Speech Input
   📡 Smart API Selector System
   🎯 Enhanced Context Awareness
   ⚡ Current Knowledge + Real-time Search
   ═══════════════════════════════════════════════════
`);
// FIXED: Voice synthesis function (add to your existing script.js)
speakText(text) {
    if (!this.synthesis) {
        console.warn('Speech synthesis not available');
        return;
    }
    
    // Clean text for speech
    const cleanText = text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown
        .replace(/[🤖📚📊🌱⚡🔍💡✅❌]/g, '') // Remove emojis
        .substring(0, 500);
    
    if (cleanText.length < 5) return;
    
    // Cancel ongoing speech
    this.synthesis.cancel();
    
    // Create and speak
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        utterance.pitch = 0.8;
        
        this.synthesis.speak(utterance);
        console.log('🔊 Speaking:', cleanText.substring(0, 50) + '...');
    }, 100);
}
