class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.1-FixedScroll";
        this.isProcessing = false;
        this.conversationHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing JARVIS - Fixed Scroll Version...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupEventListeners();
            this.initializeVoiceSystem();
            this.updateSystemStatus("JARVIS Online", "Ready for commands");
            console.log("✅ JARVIS Fixed Scroll Version Active");
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

        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');
                
                // Handle menu actions
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

            // Auto-detect test generation requests
            const isTestRequest = this.isTestGenerationRequest(message);
            const finalRequestType = isTestRequest ? 'test-generation' : requestType;

            // Get AI response with retry logic
            const response = await this.getAIResponseWithRetry(message, finalRequestType);
            
            // Add AI response to history (only for conversations, not tests)
            if (finalRequestType === 'conversation') {
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
            
            // Show actual error
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

    isTestGenerationRequest(message) {
        const testKeywords = [
            'test', 'quiz', 'exam', 'practice', 'questions', 'mcq', 'assessment',
            'generate test', 'create quiz', 'practice questions', 'mock test'
        ];
        
        const messageLower = message.toLowerCase();
        return testKeywords.some(keyword => messageLower.includes(keyword));
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
            messageContent.innerHTML = this.escapeHTML(content);
        } else {
            messageContent.innerHTML = this.formatAIContent(content);
            
            // Add speaker icon for JARVIS messages
            if (withSpeaker) {
                const speakerIcon = document.createElement('button');
                speakerIcon.className = 'speaker-icon';
                speakerIcon.innerHTML = '🔊 Speak';
                speakerIcon.title = 'Click to hear response';
                speakerIcon.addEventListener('click', () => {
                    this.speakText(content);
                });
                messageDiv.appendChild(speakerIcon);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // FIXED: Scroll only the chat messages container to bottom
        this.scrollToBottom();
    }

    formatAIContent(content) {
        // Enhanced formatting for AI responses
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code style="background:#1a1a1a;padding:2px 4px;border-radius:4px;">$1</code>') // Inline code
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

    // FIXED: Scroll only chat messages container, not entire page
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

    speakText(text) {
        if (!this.synthesis) return;
        
        // Clean text for speech
        const cleanText = text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .substring(0, 500); // Limit length
        
        if (cleanText.length < 10) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        utterance.pitch = 0.8;
        
        this.synthesis.speak(utterance);
    }

    handleInitializationError(error) {
        console.error("Initialization error:", error);
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f0f0f;color:#e5e7eb;font-family:Inter,sans-serif;">
                <div style="text-align:center;padding:2rem;">
                    <h1>🚨 JARVIS Initialization Error</h1>
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
   JARVIS AI ULTIMATE - Fixed Scroll v7.1
   ═══════════════════════════════════════════════════
   🎨 Professional UI with Fixed Sidebar
   🔄 Independent Chat Scrolling
   🧠 Groq Llama 3.3 70B Integration
   🔊 Voice Response System
   ✅ Scrolling Bug Fixed
   ═══════════════════════════════════════════════════
`);
