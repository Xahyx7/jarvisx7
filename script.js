class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2.1-FoundationIntelligence";
        this.isProcessing = false;
        this.conversationHistory = this.loadConversationHistory();
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.recognition = null;
        this.currentMode = 'chat';
        this.currentImageAPI = 'pollinations';
        this.synthesis = null;
        this.initialize();
    }
    async initialize() {
        await this.waitForDOM();
        this.initializeUIElements();
        this.setupEventListeners();
        this.setupModeSelection();
        this.setupImageApiSelector();
        this.initializeVoiceSystem();
        this.initializeSpeechRecognition();
        this.updateSystemStatus("JARVIS v7.2.1 Online", "Foundation Intelligence Ready");
        this.renderAllMessages();
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

        // Clear conversation history (privacy)
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Clear your conversation history?')) {
                    this.clearConversationHistory();
                }
            });
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
        this.conversationHistory = [];
        localStorage.removeItem('jarvis_history');
        this.renderAllMessages();
    }
    renderAllMessages() {
        if (!this.elements?.messagesContainer) return;
        this.elements.messagesContainer.innerHTML = '';
        for (const msg of this.conversationHistory) {
            this.renderMessage(msg.content, msg.role, false, msg.provider);
        }
    }
    renderMessage(content, sender, withSpeaker = false, provider = '') {
        const messagesContainer = this.elements.messagesContainer;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'jarvis-message'}`;
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        if (sender === 'user') {
            messageContent.textContent = content;
        } else {
            if (content.startsWith('<img')) messageContent.innerHTML = content;
            else messageContent.innerHTML = content;
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
    addMessage(content, sender, withSpeaker = false, provider = '') {
        this.conversationHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content,
            provider
        });
        this.saveConversationHistory();
        this.renderMessage(content, sender, withSpeaker, provider);
    }
    async processUserMessage() {
        if (this.isProcessing) return;
        let message = this.elements.messageInput.value.trim();
        if (!message) return;
        this.isProcessing = true;
        setTimeout(() => {
            this.elements.messageInput.value = '';
            this.elements.messageInput.style.height = '54px';
            this.updateSendButton();
        }, 100);

        // Context-aware follow-ups
        if (/^(explain again|expand|repeat|elaborate|clarify|explain more)$/i.test(message)) {
            const lastBotMsg = [...this.conversationHistory].reverse().find(m => m.role === 'assistant' && m.content);
            if (lastBotMsg) {
                message += `\n\n(REFERENCE:${lastBotMsg.content})`;
            }
        }
        this.addMessage(message, 'user');
        this.showTypingIndicator();
        this.updateSystemStatus(`Processing in ${this.currentMode} mode...`, "Please wait");
        try {
            const response = await this.getResponseBasedOnMode(message);
            this.hideTypingIndicator();
            if (response.output_url) {
                const imgTag = `<img src="${response.output_url}" style="max-width: 100%; border-radius: 1rem;" />`;
                this.addMessage(imgTag, 'jarvis', false, response.provider);
            } else {
                this.addMessage(response.response || response.text, 'jarvis', true, response.provider);
            }
            this.updateSystemStatus("Response complete", `via ${response.provider}`);
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'jarvis');
            this.updateSystemStatus("Error", error.message);
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => { this.elements.messageInput.focus(); }, 100);
        }
    }
    // ... all your other methods from v7.2 here (unchanged unless you want more) ...
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jarvis = new JarvisAIUltimate();
    });
} else {
    window.jarvis = new JarvisAIUltimate();
}
