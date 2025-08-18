class JarvisAIUltimate {
    constructor() {
        this.version = "JARVIS-Ultimate-v7.2.1-Fixed";
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
        this.setupVoice();
        this.updateInputPlaceholder();
        this.updateApiStatus("🧠 Groq ready");
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
            apiSelector: document.getElementById('image-api-selector'),
            apiStatus: document.getElementById('apiStatus'),
            sidebar: document.querySelector('.sidebar-menu'),
            statusBar: document.getElementById('statusText'),
            clearBtn: document.getElementById('clearHistoryBtn')
        };
    }

    setupSidebarNavigation() {
        const items = document.querySelectorAll('.menu-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const mode = item.getAttribute('data-mode');
                if (!mode) return;
                this.switchMode(mode);
            });
        });
        items.forEach(item => {
            item.addEventListener('keyup', (e) => {
                if (e.key === "Enter" || e.key === " ") item.click();
            });
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        switch (mode) {
            case 'chat':
                this.hideImageApiSelector();
                this.showStatus("Chat Ready");
                this.updateApiStatus("🧠 Groq ready");
                break;
            case 'search':
                this.hideImageApiSelector();
                this.showStatus("Web Search Ready");
                this.updateApiStatus("🔍 Serper ready");
                break;
            case 'image':
                this.showImageApiSelector();
                this.showStatus("Image Generator Ready");
                this.updateApiStatus("🎨 Pollinations");
                this.addMessage("🎨 Image Mode Activated! Pick a style above and type what to generate.", 'jarvis', false, '');
                break;
            default:
                this.hideImageApiSelector();
                this.showStatus(`Mode: ${mode}`);
                this.updateApiStatus('');
        }
        this.updateInputPlaceholder();
    }

    setupImageApiSelector() {
        const btns = document.querySelectorAll('#image-api-selector .api-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentImageAPI = btn.getAttribute('data-api');
                this.updateApiStatus(`🎨 ${btn.textContent.trim()}`);
                this.addMessage(`🎨 Image API: ${this.currentImageAPI}`, 'jarvis');
                this.updateInputPlaceholder();
            });
        });
    }

    showImageApiSelector() { this.$.apiSelector.style.display = 'flex'; }
    hideImageApiSelector() { this.$.apiSelector.style.display = 'none'; }

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
            provider
        });
        this.saveConversationHistory();
        this.renderMessage(content, sender, withSpeaker, provider);
    }

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
                messageContent.innerHTML = content;
            }
            
            if (provider) {
                const providerInfo = document.createElement('div');
                providerInfo.className = 'provider-info';
                providerInfo.textContent = `Provider: ${provider}`;
                messageDiv.appendChild(providerInfo);
            }
            
            if (withSpeaker) {
                const speakerBtn = document.createElement('button');
                speakerBtn.className = 'speaker-icon';
                speakerBtn.textContent = '🔊 Speak';
                speakerBtn.title = 'Speak response';
                speakerBtn.onclick = (e) => {
                    e.preventDefault();
                    this.speakText(content);
                };
                messageDiv.appendChild(speakerBtn);
            }
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    async processUserMessage() {
        if (this.isProcessing) return;
        let message = this.$.messageInput.value.trim();
        if (!message) return;
        
        this.isProcessing = true;
        this.updateSendButton();
        
        // Add the user message and clear input immediately
        this.addMessage(message, 'user');
        this.$.messageInput.value = '';
        this.$.messageInput.style.height = '54px';
        this.updateInputPlaceholder();
        this.showTypingIndicator();
        this.showStatus(`Processing in ${this.currentMode} mode...`);
        
        try {
            // Contextual follow-up
            if (/^(explain again|expand|repeat|elaborate|clarify|explain more)$/i.test(message)) {
                const lastBotMsg = [...this.conversationHistory].reverse().find(m => m.role === 'assistant' && m.content);
                if (lastBotMsg) {
                    message += `\n\n(REFERENCE:${lastBotMsg.content})`;
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
            this.hideTypingIndicator();
            this.addMessage(`Error: ${error.message}`, 'jarvis');
            this.showStatus('Error');
        } finally {
            this.isProcessing = false;
            this.updateSendButton();
            setTimeout(() => this.$.messageInput.focus(), 100);
        }
    }

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
            if (this.currentImageAPI === 'huggingface') endpoint = '/api/image-huggingface';
            else if (this.currentImageAPI === 'kroki') endpoint = '/api/kroki';
            else endpoint = '/api/image-pollination';
        } else { 
            endpoint = '/api/chat'; 
            task = 'chat'; 
        }
        
        const payload = { 
            message: message, 
            history: this.conversationHistory.slice(-4), 
            task: task 
        };
        
        const response = await fetch(endpoint, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        return await response.json();
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

    setupVoice() {
        if (this.synthesis) this.synthesis.onvoiceschanged = () => null;
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRec();
            this.recognition.lang = "en-US";
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.onstart = () => this.showStatus("Listening... Speak now");
            this.recognition.onresult = (e) => {
                const transcript = e.results[0].transcript;
                this.$.messageInput.value = transcript;
                this.updateSendButton();
                this.$.messageInput.focus();
            };
            this.recognition.onerror = () => this.showStatus('Speech recognition error');
            this.recognition.onend = () => this.showStatus('Ready');
        }
    }

    startVoiceRecognition() { 
        if (this.recognition) this.recognition.start(); 
    }

    speakText(text) {
        if (!this.synthesis) return;
        const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 350);
        if (cleanText.length < 5) return;
        this.synthesis.cancel();
        setTimeout(() => {
            const utter = new SpeechSynthesisUtterance(cleanText);
            utter.rate = 0.95; 
            utter.volume = 0.83;
            this.synthesis.speak(utter);
        }, 70);
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
        if (this.currentMode === 'search') p = "What do you want to know from the web?";
        else if (this.currentMode === 'image') {
            if (this.currentImageAPI === 'kroki') p = "Describe a diagram (e.g. flowchart)";
            else if (this.currentImageAPI === 'huggingface') p = "Describe an image or diagram...";
            else p = "What image would you like to generate?";
        }
        else p = "Ask JARVIS anything or chat... (Ctrl+Space for voice)";
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.jarvis = new JarvisAIUltimate());
} else {
    window.jarvis = new JarvisAIUltimate();
}

console.log("🤖 JARVIS AI v7.2.1 Fixed - loaded and ready");
