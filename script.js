class JarvisAIUltimate {
    constructor() {
        this.version = "NOVA-Ultimate-v7.2.1-Fixed-WebSearch";
        this.isProcessing = false;
        this.conversationHistory = this.loadConversationHistory();
        this.currentMode = 'chat';
        this.currentImageAPI = 'pollinations';
        this.synthesis = window.speechSynthesis || null;
        this.recognition = null;
        this.init();
    }

    async init() {
        await this.waitForDOM();
        this.cacheUI();
        this.renderAllMessages();
        this.setupSidebarNavigation();
        this.setupImageApiSelector();
        this.setupFormEvents();
        this.setupVoice(); // Enhanced voice setup
        this.setupNeonEffects();
        this.updateInputPlaceholder();
        this.updateApiStatus("🧠 NOVA ready");
        this.showStatus("Ready");
    }

    async waitForDOM() {
        if (document.readyState === "loading") {
            return new Promise(res => document.addEventListener("DOMContentLoaded", res));
        }
    }

    cacheUI() {
        this.$ = {
            messages: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            messageForm: document.getElementById('messageForm'),
            sendBtn: document.getElementById('sendBtn'),
            typingIndicator: document.getElementById('typingIndicator'),
            apiSelector: document.querySelector('.image-api-selector'),
            apiStatus: document.getElementById('apiStatus'),
            sidebar: document.querySelector('.sidebar'),
            statusBar: document.getElementById('statusText'),
            clearBtn: document.getElementById('clearHistoryBtn')
        };
    }

    // ENHANCED SIDEBAR SETUP WITH GLOW EFFECTS
    setupSidebarNavigation() {
        const items = document.querySelectorAll('.sidebar-item');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active from all items
                items.forEach(i => i.classList.remove('active'));
                
                // Add active to clicked item
                item.classList.add('active');
                
                // Get mode and switch
                const mode = item.getAttribute('data-mode');
                if (mode) {
                    this.switchMode(mode);
                }
                
                // Add temporary intense glow effect
                item.style.boxShadow = '0 0 40px rgba(211, 211, 211, 1), 0 0 80px rgba(211, 211, 211, 0.5)';
                setTimeout(() => {
                    item.style.boxShadow = '0 0 30px rgba(211, 211, 211, 0.8), 0 0 60px rgba(211, 211, 211, 0.4)';
                }, 300);
            });
            
            // Enhanced hover effects
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateY(-2px)';
                    item.style.boxShadow = '0 0 20px rgba(211, 211, 211, 0.6)';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateY(0)';
                    item.style.boxShadow = 'none';
                }
            });
        });

        // Keyboard navigation
        items.forEach(item => {
            item.addEventListener('keyup', (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    // NEON EFFECTS FOR NOVA TEXT
    setupNeonEffects() {
        const novaText = document.querySelector('.neon-nova');
        if (novaText) {
            // Add click effect
            novaText.addEventListener('click', () => {
                novaText.style.animation = 'none';
                novaText.style.textShadow = '0 0 20px #f0f0f0, 0 0 40px #f0f0f0, 0 0 60px #f5f5f5, 0 0 80px #f5f5f5';
                
                setTimeout(() => {
                    novaText.style.animation = 'neonPulse 2s ease-in-out infinite alternate';
                    novaText.style.textShadow = '';
                }, 1000);
            });
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        console.log(`🔄 Switching to mode: ${mode}`);
        
        // Enhanced glow effect on logo during mode switch
        const logoOrb = document.querySelector('.nova-logo-orb');
        if (logoOrb) {
            logoOrb.style.boxShadow = '0 0 40px rgba(211, 211, 211, 1), 0 0 80px rgba(211, 211, 211, 0.5), 0 0 120px rgba(211, 211, 211, 0.3)';
            setTimeout(() => {
                logoOrb.style.boxShadow = '0 0 30px rgba(211, 211, 211, 0.8), 0 0 60px rgba(211, 211, 211, 0.4)';
            }, 500);
        }
        
        switch (mode) {
            case 'chat':
                this.hideImageApiSelector();
                this.showStatus("Chat Ready");
                this.updateApiStatus("🧠 NOVA ready");
                this.addMessage("💬 Chat mode activated. Ask me anything!", 'jarvis', false, '');
                break;
            case 'search':
                this.hideImageApiSelector();
                this.showStatus("Web Search Ready");
                this.updateApiStatus("🔍 Web Search ready");
                this.addMessage("🔍 Web Search mode activated! I'll search the internet for you.", 'jarvis', false, '');
                break;
            case 'image':
                this.showImageApiSelector();
                this.showStatus("Image Generator Ready");
                this.updateApiStatus("🎨 Pollinations");
                this.addMessage("🎨 Image Mode Activated! Pick a style above and type what to generate.", 'jarvis', false, '');
                break;
            case 'settings':
                this.hideImageApiSelector();
                this.showStatus("Settings");
                this.updateApiStatus("⚙️ Settings");
                this.addMessage("⚙️ Settings mode - Configure your NOVA experience.", 'jarvis', false, '');
                break;
            case 'analytics':
                this.hideImageApiSelector();
                this.showStatus("Analytics");
                this.updateApiStatus("📊 Analytics");
                this.addMessage("📊 Analytics mode - View your usage statistics.", 'jarvis', false, '');
                break;
            case 'help':
                this.hideImageApiSelector();
                this.showStatus("Help");
                this.updateApiStatus("❓ Help");
                this.addMessage("❓ Help mode - Available commands:\n• Chat: General conversation\n• Web Search: Real-time web searches\n• Image Gen: Generate images\n• Voice: Ctrl+Space for voice input", 'jarvis', false, '');
                break;
            default:
                this.hideImageApiSelector();
                this.showStatus(`Mode: ${mode}`);
                this.updateApiStatus('');
        }
        this.updateInputPlaceholder();
    }

    setupImageApiSelector() {
        const btns = document.querySelectorAll('.image-api-selector .api-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentImageAPI = btn.getAttribute('data-api');
                this.updateApiStatus(`🎨 ${btn.textContent.trim()}`);
                this.addMessage(`🎨 Image API switched to: ${this.currentImageAPI}`, 'jarvis');
                this.updateInputPlaceholder();
            });
        });
    }

    // FIXED SHOW/HIDE IMAGE SELECTOR METHODS
    showImageApiSelector() { 
        const selector = document.querySelector('.image-api-selector');
        if (selector) {
            selector.style.display = 'flex';
        }
    }

    hideImageApiSelector() { 
        const selector = document.querySelector('.image-api-selector');
        if (selector) {
            selector.style.display = 'none';
        }
    }

    loadConversationHistory() {
        const saved = localStorage.getItem('jarvis_history');
        return saved ? JSON.parse(saved) : [];
    }

    saveConversationHistory() {
        localStorage.setItem('jarvis_history', JSON.stringify(this.conversationHistory));
    }

    clearConversationHistory() {
        if (!confirm("Clear your entire conversation history?")) return;
        this.conversationHistory = [];
        localStorage.removeItem('jarvis_history');
        this.renderAllMessages();
        this.showStatus("Chat cleared.");
        this.addMessage("🧹 Conversation history cleared.", 'jarvis', false, '');
    }

    renderAllMessages() {
        if (!this.$?.messages) return;
        this.$.messages.innerHTML = '';
        for (const msg of this.conversationHistory) {
            this.renderMessage(msg.content, msg.role, false, msg.provider);
        }
    }

    addMessage(content, sender, withSpeaker = false, provider = '') {
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content,
            provider,
            timestamp: new Date().toISOString()
        });
        this.saveConversationHistory();
        this.renderMessage(content, sender, withSpeaker, provider);
    }

    // ENHANCED RENDER MESSAGE WITH FIXED SPEAKER BUTTON
    renderMessage(content, sender, withSpeaker = false, provider = '') {
        const messagesContainer = this.$.messages;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'jarvis-message'}`;
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (sender === 'user') {
            messageContent.textContent = content;
        } else {
            if (content.startsWith('<img')) {
                messageContent.innerHTML = content;
            } else {
                messageContent.innerHTML = content.replace(/\n/g, '<br>');
            }
            
            if (provider) {
                const providerInfo = document.createElement('div');
                providerInfo.className = 'provider-info';
                providerInfo.textContent = `Provider: ${provider}`;
                messageDiv.appendChild(providerInfo);
            }
            
            // ENHANCED SPEAKER BUTTON WITH PROPER FUNCTIONALITY
            if (withSpeaker) {
                const speakerBtn = document.createElement('button');
                speakerBtn.className = 'speaker-icon';
                speakerBtn.innerHTML = '🔊 Speak';
                speakerBtn.title = 'Click to hear this message';
                
                // Enhanced click handler
                speakerBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Visual feedback
                    const originalText = speakerBtn.innerHTML;
                    speakerBtn.innerHTML = '🔊 Speaking...';
                    speakerBtn.disabled = true;
                    
                    // Speak the text
                    this.speakText(content);
                    
                    // Reset button after delay
                    setTimeout(() => {
                        speakerBtn.innerHTML = originalText;
                        speakerBtn.disabled = false;
                    }, 2000);
                };
                
                messageDiv.appendChild(speakerBtn);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async processUserMessage() {
        if (this.isProcessing) {
            console.warn('Already processing a message');
            return;
        }
        
        let message = this.$.messageInput.value.trim();
        if (!message) {
            console.warn('Empty message - not sending');
            return;
        }
        
        this.isProcessing = true;
        this.updateSendButton();
        
        this.addMessage(message, 'user');
        this.$.messageInput.value = '';
        this.$.messageInput.style.height = '54px';
        this.updateInputPlaceholder();
        this.showTypingIndicator();
        this.showStatus(`Processing in ${this.currentMode} mode...`);
        
        try {
            if (/^(explain again|expand|repeat|elaborate|clarify|explain more)$/i.test(message)) {
                const lastBotMsg = [...this.conversationHistory].reverse().find(m => m.role === 'assistant' && m.content);
                if (lastBotMsg) {
                    message += `\n\n(REFERENCE:${lastBotMsg.content})`;
                    console.log('Contextual follow-up detected');
                }
            }
            
            const response = await this.getResponseBasedOnMode(message);
            this.hideTypingIndicator();
            
            if (response.output_url) {
                this.addMessage(`<img src="${response.output_url}" style="max-width:100%;border-radius:1rem;"/>`, 'jarvis', false, response.provider);
            } else {
                this.addMessage(response.response || response.text, 'jarvis', true, response.provider);
            }
            
            this.showStatus('Response complete');
        } catch (error) {
            console.error('Error in processUserMessage:', error);
            this.hideTypingIndicator();
            this.addMessage(`❌ Error: ${error.message}`, 'jarvis');
            this.showStatus('Error');
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => this.$.messageInput.focus(), 100);
        }
    }

    async getResponseBasedOnMode(message) {
        let endpoint, task;
        
        console.log(`🎯 Current mode: ${this.currentMode}`);
        
        switch (this.currentMode) {
            case 'chat':
                endpoint = '/api/chat';
                task = 'chat';
                console.log('📡 Using chat endpoint');
                break;
            case 'search':
                endpoint = '/api/search';
                task = 'search';
                console.log('🔍 Using search endpoint');
                break;
            case 'image':
                task = 'image';
                console.log(`🎨 Using image endpoint: ${this.currentImageAPI}`);
                if (this.currentImageAPI === 'huggingface') endpoint = '/api/image-huggingface';
                else if (this.currentImageAPI === 'kroki') endpoint = '/api/kroki';
                else endpoint = '/api/image-pollination';
                break;
            case 'settings':
            case 'analytics':
            case 'help':
                endpoint = '/api/chat';
                task = 'chat';
                break;
            default:
                endpoint = '/api/chat';
                task = 'chat';
        }
        
        const payload = { 
            message: message, 
            history: this.conversationHistory.slice(-4), 
            task: task 
        };
        
        console.log(`📤 Sending to ${endpoint}:`, { message: message.substring(0, 50), task });
        
        const response = await fetch(endpoint, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error ${response.status}:`, errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📥 Response received:', result);
        return result;
    }

    setupFormEvents() {
        this.$.messageForm.addEventListener('submit', e => {
            e.preventDefault();
            this.processUserMessage();
        });
        
        this.$.sendBtn.addEventListener('click', e => {
            e.preventDefault();
            this.processUserMessage();
        });
        
        this.$.messageInput.addEventListener('input', () => {
            this.updateSendButton();
            this.autoResizeTextarea();
        });
        
        this.$.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.processUserMessage();
            }
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                this.startVoiceRecognition();
            }
        });
        
        this.$.clearBtn.addEventListener('click', () => this.clearConversationHistory());
    }

    // ENHANCED VOICE SETUP WITH BETTER SPEECH SYNTHESIS
    setupVoice() {
        // Initialize speech synthesis
        if (window.speechSynthesis) {
            this.synthesis = window.speechSynthesis;
            
            // Load voices
            this.synthesis.onvoiceschanged = () => {
                const voices = this.synthesis.getVoices();
                console.log(`🎤 Loaded ${voices.length} voices`);
            };
            
            // Trigger voice loading
            this.synthesis.getVoices();
            
        } else {
            console.warn('❌ Speech synthesis not supported');
            this.synthesis = null;
        }
        
        // Initialize speech recognition
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRec();
            this.recognition.lang = "en-US";
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            
            this.recognition.onstart = () => this.showStatus("🎤 Listening... Speak now");
            this.recognition.onresult = (e) => {
                const transcript = e.results[0][0].transcript;
                this.$.messageInput.value = transcript;
                this.updateSendButton();
                this.$.messageInput.focus();
            };
            this.recognition.onerror = () => this.showStatus('❌ Speech recognition error');
            this.recognition.onend = () => this.showStatus('Ready');
        }
    }

    startVoiceRecognition() { 
        if (this.recognition) {
            this.recognition.start();
        } else {
            this.showStatus('🚫 Voice recognition not supported');
        }
    }

    // COMPLETELY FIXED TEXT-TO-SPEECH METHOD
    speakText(text) {
        console.log('🔊 Speaking:', text.substring(0, 50));
        
        if (!this.synthesis) {
            console.warn('❌ Speech synthesis not supported');
            this.showStatus('🚫 Text-to-speech not supported in this browser');
            return;
        }
        
        // Clean the text thoroughly
        const cleanText = text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
            .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
            .replace(/``````/g, '') // Remove code blocks
            .replace(/`([^`]*)`/g, '$1') // Remove inline code
            .replace(/\n+/g, ' ') // Replace line breaks with spaces
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters
            .trim()
            .substring(0, 500); // Limit length for performance
        
        if (cleanText.length < 3) {
            console.warn('❌ Text too short to speak');
            return;
        }
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        // Wait a bit before starting new speech (important for some browsers)
        setTimeout(() => {
            try {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                
                // Configure voice settings for better quality
                utterance.rate = 0.9;
                utterance.pitch = 1;
                utterance.volume = 0.8;
                
                // Try to use a good English voice
                const voices = this.synthesis.getVoices();
                if (voices.length > 0) {
                    // Prefer English voices that aren't robotic
                    const englishVoice = voices.find(voice => 
                        voice.lang.includes('en-') && 
                        (voice.name.includes('Microsoft') || voice.name.includes('Alex') || voice.name.includes('Samantha'))
                    ) || voices.find(voice => voice.lang.includes('en-')) || voices[0];
                    
                    utterance.voice = englishVoice;
                    console.log('🎤 Using voice:', englishVoice.name);
                }
                
                // Event handlers for better user feedback
                utterance.onstart = () => {
                    console.log('🎤 Started speaking');
                    this.showStatus('🔊 Speaking...');
                };
                
                utterance.onend = () => {
                    console.log('✅ Finished speaking');
                    this.showStatus('Ready');
                };
                
                utterance.onerror = (e) => {
                    console.error('❌ Speech error:', e);
                    this.showStatus('❌ Speech error');
                };
                
                // Start speaking
                this.synthesis.speak(utterance);
                
            } catch (error) {
                console.error('❌ Speech synthesis error:', error);
                this.showStatus('❌ Speech failed');
            }
        }, 150);
    }

    autoResizeTextarea() {
        const area = this.$.messageInput;
        area.style.height = 'auto';
        area.style.height = Math.min(area.scrollHeight, 120) + 'px';
    }

    updateSendButton() {
        const hasText = this.$.messageInput.value.trim().length > 0;
        this.$.sendBtn.disabled = !hasText || this.isProcessing;
        this.$.sendBtn.textContent = this.isProcessing ? "Sending..." : "Send";
    }

    updateInputPlaceholder() {
        let p = "";
        switch (this.currentMode) {
            case 'search':
                p = "🔍 What would you like to search for on the web?";
                break;
            case 'image':
                if (this.currentImageAPI === 'kroki') p = "📊 Describe a diagram (e.g., flowchart, sequence diagram)";
                else if (this.currentImageAPI === 'huggingface') p = "🤖 Describe an image to generate...";
                else p = "🎨 What image would you like to generate?";
                break;
            case 'settings':
                p = "⚙️ Configure NOVA settings...";
                break;
            case 'analytics':
                p = "📊 Ask about usage analytics...";
                break;
            case 'help':
                p = "❓ Ask for help or available commands...";
                break;
            default:
                p = "💬 Ask NOVA anything... (Ctrl+Space for voice)";
        }
        this.$.messageInput.placeholder = p;
    }

    updateApiStatus(status) { 
        if (this.$?.apiStatus) this.$.apiStatus.textContent = status; 
    }

    showStatus(text) { 
        if (this.$?.statusBar) this.$.statusBar.textContent = text; 
    }

    showTypingIndicator() { 
        this.$.typingIndicator.style.display = 'flex'; 
        this.scrollToBottom(); 
    }

    hideTypingIndicator() { 
        this.$.typingIndicator.style.display = 'none'; 
    }

    scrollToBottom() { 
        setTimeout(() => { 
            if (this.$?.messages) this.$.messages.scrollTop = this.$.messages.scrollHeight; 
        }, 80); 
    }
}

// Initialize NOVA when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.jarvis = new JarvisAIUltimate());
} else {
    window.jarvis = new JarvisAIUltimate();
}

console.log("🤖 NOVA AI v7.2.1 - Professional UI with FIXED Text-to-Speech - loaded and ready");
