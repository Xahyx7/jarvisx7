class JarvisAIUltimate {
    constructor() {
        this.version = "NOVA-Ultimate-v7.2.1-Phase2-Complete";
        this.isProcessing = false;
        this.currentMode = 'chat';
        this.currentImageAPI = 'pollinations';
        this.synthesis = window.speechSynthesis || null;
        this.recognition = null;
        this.typewriterUsed = { chat: false, search: false, image: false };
        this.shimmerTimeout = null;
        this.isLibraryOpen = false;
        this.$ = {};
        
        // Session management
        this.sessions = this.loadSessions();
        this.currentSessionId = this.getCurrentSessionId();
        this.conversationHistory = this.getCurrentSessionMessages();
        
        this.init();
    }

    async init() {
        await this.waitForDOM();
        this.cacheUI();
        this.setupLibrarySidebar();
        this.setupSidebarNavigation();
        this.setupImageApiSelector();
        this.setupFormEvents();
        this.setupVoice();
        this.setupNeonEffects();
        
        this.renderAllMessages();
        this.renderSessionsList();
        this.updateInputPlaceholder();
        this.updateApiStatus("🧠 NOVA ready");
        this.updateSessionInfo();
        this.showStatus("Ready");

        if (this.conversationHistory.length === 0) {
            this.showHero();
        } else {
            this.collapseHeroThenHide();
            setTimeout(() => this.scrollToBottom(), 200);
        }
    }

    async waitForDOM() {
        if (document.readyState === "loading") {
            return new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve));
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
            sidebarItems: document.querySelectorAll('.sidebar-item'),
            statusBar: document.getElementById('statusText'),
            clearBtn: document.getElementById('clearHistoryBtn'),
            hero: document.getElementById('novaHero'),
            imageShimmer: document.getElementById('imageShimmer'),
            chatContainer: document.querySelector('.chat-container'),
            searchResults: document.getElementById('searchResults'),
            sessionInfo: document.getElementById('sessionInfo')
        };
    }

    // === SESSION MANAGEMENT ===

    loadSessions() {
        try {
            const saved = localStorage.getItem('nova_sessions');
            const sessions = saved ? JSON.parse(saved) : {};
            
            if (!sessions['default']) {
                sessions['default'] = {
                    id: 'default',
                    name: 'Default Chat',
                    messages: [],
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    mode: 'chat'
                };
            }
            
            return sessions;
        } catch (error) {
            console.error('Error loading sessions:', error);
            return { 
                'default': { 
                    id: 'default', 
                    name: 'Default Chat', 
                    messages: [], 
                    created: new Date().toISOString(), 
                    lastModified: new Date().toISOString(), 
                    mode: 'chat' 
                } 
            };
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('nova_sessions', JSON.stringify(this.sessions));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    getCurrentSessionId() {
        return localStorage.getItem('nova_current_session') || 'default';
    }

    getCurrentSessionMessages() {
        const sessionId = this.getCurrentSessionId();
        return this.sessions[sessionId]?.messages || [];
    }

    setCurrentSession(sessionId) {
        this.currentSessionId = sessionId;
        localStorage.setItem('nova_current_session', sessionId);
        
        if (this.sessions[sessionId]) {
            this.conversationHistory = this.sessions[sessionId].messages;
            this.renderAllMessages();
            this.updateSessionInfo();
            this.renderSessionsList();
            
            if (this.conversationHistory.length === 0) {
                this.showHero();
            } else {
                this.collapseHeroThenHide();
            }
        }
    }

    createNewSession() {
        const sessionId = 'session_' + Date.now();
        const sessionName = `Chat ${Object.keys(this.sessions).length}`;
        
        this.sessions[sessionId] = {
            id: sessionId,
            name: sessionName,
            messages: [],
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            mode: this.currentMode
        };
        
        this.saveSessions();
        this.setCurrentSession(sessionId);
        this.showHero();
        this.toggleLibrary(); // Close library after creating new session
    }

    deleteSession(sessionId) {
        if (sessionId === 'default') return;
        
        if (confirm('Delete this chat session?')) {
            delete this.sessions[sessionId];
            this.saveSessions();
            
            if (this.currentSessionId === sessionId) {
                this.setCurrentSession('default');
            }
            
            this.renderSessionsList();
        }
    }

    renameSession(sessionId, newName) {
        if (this.sessions[sessionId]) {
            this.sessions[sessionId].name = newName;
            this.sessions[sessionId].lastModified = new Date().toISOString();
            this.saveSessions();
            this.renderSessionsList();
            this.updateSessionInfo();
        }
    }

    updateSessionInfo() {
        if (this.$.sessionInfo && this.sessions[this.currentSessionId]) {
            this.$.sessionInfo.textContent = `Session: ${this.sessions[this.currentSessionId].name}`;
        }
    }

    // === LIBRARY SIDEBAR MANAGEMENT ===

    setupLibrarySidebar() {
        const libraryToggle = document.getElementById('libraryToggle');
        const closeLibrary = document.getElementById('closeLibrary');
        const libraryOverlay = document.getElementById('libraryOverlay');
        const newChatBtn = document.getElementById('newChatBtn');
        
        if (libraryToggle) {
            libraryToggle.addEventListener('click', () => this.toggleLibrary());
        }
        
        if (closeLibrary) {
            closeLibrary.addEventListener('click', () => this.toggleLibrary());
        }
        
        if (libraryOverlay) {
            libraryOverlay.addEventListener('click', () => this.toggleLibrary());
        }
        
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.createNewSession());
        }
    }

    toggleLibrary() {
        const librarySidebar = document.getElementById('librarySidebar');
        const libraryOverlay = document.getElementById('libraryOverlay');
        const mainPanel = document.querySelector('.main-panel');
        
        if (!librarySidebar || !libraryOverlay || !mainPanel) return;
        
        this.isLibraryOpen = !this.isLibraryOpen;
        
        if (this.isLibraryOpen) {
            librarySidebar.classList.add('open');
            libraryOverlay.classList.add('active');
            mainPanel.classList.add('library-open');
        } else {
            librarySidebar.classList.remove('open');
            libraryOverlay.classList.remove('active');
            mainPanel.classList.remove('library-open');
        }
    }

    renderSessionsList() {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;
        
        const sessionsArray = Object.values(this.sessions).sort((a, b) => 
            new Date(b.lastModified) - new Date(a.lastModified)
        );
        
        sessionsList.innerHTML = sessionsArray.map(session => `
            <div class="session-item ${session.id === this.currentSessionId ? 'active' : ''}" 
                 data-session-id="${session.id}">
                <span class="session-icon">${this.getSessionIcon(session.mode)}</span>
                <div class="session-info">
                    <div class="session-name" ondblclick="window.jarvis.editSessionName('${session.id}')">${session.name}</div>
                    <div class="session-meta">${this.formatDate(session.lastModified)} • ${session.messages.length} messages</div>
                </div>
                <div class="session-actions">
                    <button class="session-action-btn" onclick="window.jarvis.editSessionName('${session.id}')" title="Rename">✏️</button>
                    ${session.id !== 'default' ? `<button class="session-action-btn" onclick="window.jarvis.deleteSession('${session.id}')" title="Delete">🗑️</button>` : ''}
                </div>
            </div>
        `).join('');
        
        // Add click listeners
        sessionsList.querySelectorAll('.session-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('session-action-btn')) {
                    const sessionId = item.getAttribute('data-session-id');
                    this.setCurrentSession(sessionId);
                }
            });
        });
    }

    getSessionIcon(mode) {
        const icons = { 
            chat: '💬', 
            search: '🔍', 
            image: '🎨', 
            analytics: '📊', 
            settings: '⚙️', 
            help: '❓' 
        };
        return icons[mode] || '💬';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 30) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    editSessionName(sessionId) {
        const sessionItem = document.querySelector(`[data-session-id="${sessionId}"] .session-name`);
        if (!sessionItem) return;
        
        const currentName = sessionItem.textContent;
        const input = document.createElement('input');
        input.value = currentName;
        input.className = 'session-name editing';
        input.style.width = '100%';
        
        sessionItem.replaceWith(input);
        input.focus();
        input.select();
        
        const saveEdit = () => {
            const newName = input.value.trim() || currentName;
            this.renameSession(sessionId, newName);
        };
        
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
            if (e.key === 'Escape') {
                this.renderSessionsList();
            }
        });
    }

    // === SIDEBAR NAVIGATION ===

    setupSidebarNavigation() {
        this.$.sidebarItems.forEach(item => {
            if (item.id === 'libraryToggle') return; // Skip library toggle
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                this.$.sidebarItems.forEach(i => {
                    if (i.id !== 'libraryToggle') {
                        i.classList.remove('active');
                    }
                });
                item.classList.add('active');
                
                const mode = item.getAttribute('data-mode');
                if (mode) {
                    this.switchMode(mode);
                }
            });
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        console.log(`🔄 Switching to mode: ${mode}`);
        
        // Update current session mode
        if (this.sessions[this.currentSessionId]) {
            this.sessions[this.currentSessionId].mode = mode;
            this.saveSessions();
        }
        
        switch (mode) {
            case 'chat':
                this.hideImageApiSelector();
                this.showStatus("Chat Ready");
                this.updateApiStatus("🧠 NOVA ready");
                this.addModeMessage("💬 Chat mode activated. Ask me anything!", mode);
                break;
            case 'search':
                this.hideImageApiSelector();
                this.showStatus("Web Search Ready");
                this.updateApiStatus("🔍 Web Search ready");
                this.addModeMessage("🔍 Web Search mode activated! I'll search the internet for you.", mode);
                break;
            case 'image':
                this.showImageApiSelector();
                this.showStatus("Image Generator Ready");
                this.updateApiStatus("🎨 " + this.currentImageAPI);
                this.addModeMessage("🎨 Image Mode Activated! Pick a style above and describe what to generate.", mode);
                break;
            case 'settings':
                this.hideImageApiSelector();
                this.showStatus("Settings");
                this.updateApiStatus("⚙️ Settings");
                this.addModeMessage("⚙️ Settings mode - Configure your NOVA experience.", mode);
                break;
            case 'analytics':
                this.hideImageApiSelector();
                this.showStatus("Analytics");
                this.updateApiStatus("📊 Analytics");
                this.addModeMessage("📊 Analytics mode - View your usage statistics.", mode);
                break;
            case 'help':
                this.hideImageApiSelector();
                this.showStatus("Help");
                this.updateApiStatus("❓ Help");
                this.addModeMessage("❓ Help mode - Available commands:\n• Chat: General conversation\n• Web Search: Real-time web searches\n• Image Gen: Generate images\n• Voice: Ctrl+Space for voice input", mode);
                break;
            default:
                this.hideImageApiSelector();
                this.showStatus(`Mode: ${mode}`);
                this.updateApiStatus('');
        }
        this.updateInputPlaceholder();
    }

    addModeMessage(message, mode) {
        if (!this.typewriterUsed[mode]) {
            this.addMessage(message, 'jarvis', false, 'NOVA', { typewriter: true });
            this.typewriterUsed[mode] = true;
        }
    }

    // === IMAGE API SELECTOR ===

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

    showImageApiSelector() { 
        if (this.$.apiSelector) {
            this.$.apiSelector.style.display = 'flex';
        }
    }

    hideImageApiSelector() { 
        if (this.$.apiSelector) {
            this.$.apiSelector.style.display = 'none';
        }
    }

    // === HERO MANAGEMENT ===

    showHero() {
        if (!this.$.hero) return;
        
        this.$.hero.classList.remove('hidden', 'collapsing');
        this.$.hero.classList.add('visible');
        
        if (this.$.chatContainer) {
            this.$.chatContainer.classList.add('hero-visible');
            this.$.chatContainer.classList.remove('hero-hidden');
        }
    }

    collapseHeroThenHide() {
        if (!this.$.hero) return;
        
        this.$.hero.classList.remove('visible');
        this.$.hero.classList.add('collapsing');
        
        if (this.$.chatContainer) {
            this.$.chatContainer.classList.remove('hero-visible');
            this.$.chatContainer.classList.add('hero-hidden');
        }
        
        setTimeout(() => {
            if (this.$.hero) {
                this.$.hero.classList.remove('collapsing');
                this.$.hero.classList.add('hidden');
            }
        }, 400);
    }

    // === IMAGE SHIMMER ===

    showImageShimmer() {
        if (!this.$.imageShimmer) return;
        this.$.imageShimmer.style.display = 'block';
        this.$.imageShimmer.classList.remove('fade-out');
        this.$.imageShimmer.classList.add('fade-in');
        
        clearTimeout(this.shimmerTimeout);
        this.shimmerTimeout = setTimeout(() => this.hideImageShimmer(), 60000);
    }

    hideImageShimmer() {
        if (!this.$.imageShimmer) return;
        this.$.imageShimmer.classList.remove('fade-in');
        this.$.imageShimmer.classList.add('fade-out');
        setTimeout(() => {
            if (this.$.imageShimmer) this.$.imageShimmer.style.display = 'none';
        }, 250);
        clearTimeout(this.shimmerTimeout);
    }

    // === TYPEWRITER ANIMATION ===

    async typewriterRender(targetElement, text, speed = 20) {
        return new Promise(resolve => {
            targetElement.classList.add('typewriter');
            targetElement.textContent = '';
            let i = 0;
            const interval = setInterval(() => {
                targetElement.textContent += text.charAt(i++);
                if (i >= text.length) {
                    clearInterval(interval);
                    targetElement.classList.remove('typewriter');
                    resolve();
                }
            }, speed);
        });
    }

    // === FORM EVENTS ===

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
            if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
                e.preventDefault();
                this.startVoiceRecognition();
            }
        });
        
        if (this.$.clearBtn) {
            this.$.clearBtn.addEventListener('click', () => this.clearConversationHistory());
        }
    }

    // === VOICE SETUP ===

    setupVoice() {
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                const voices = this.synthesis.getVoices();
                console.log(`🎤 Loaded ${voices.length} voices`);
            };
            this.synthesis.getVoices();
        } else {
            console.warn('❌ Speech synthesis not supported');
            this.synthesis = null;
        }
        
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
                this.showStatus('Voice input captured');
            };
            this.recognition.onerror = () => this.showStatus('❌ Speech recognition error');
            this.recognition.onend = () => this.showStatus('Ready');
        }
    }

    setupNeonEffects() {
        const novaText = document.querySelector('.neon-nova');
        if (novaText) {
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

    startVoiceRecognition() { 
        if (this.recognition) {
            this.recognition.start();
        } else {
            this.showStatus('🚫 Voice recognition not supported');
        }
    }

    speakText(text) {
        console.log('🔊 Attempting to speak:', text.substring(0, 50));
        
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            this.showStatus('🚫 Text-to-speech not supported');
            return;
        }
        
        const cleanText = text
            .replace(/<[^>]*>/g, '')
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 300);
        
        if (cleanText.length < 2) {
            console.warn('Text too short to speak');
            return;
        }
        
        this.synthesis.cancel();
        
        setTimeout(() => {
            try {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = 0.8;
                
                utterance.onerror = (event) => {
                    console.error('Speech error:', event.error, event.type);
                    this.showStatus(`❌ Speech error: ${event.error}`);
                };
                
                utterance.onstart = () => {
                    console.log('✅ Speech started');
                    this.showStatus('🔊 Speaking...');
                };
                
                utterance.onend = () => {
                    console.log('✅ Speech ended');
                    this.showStatus('Ready');
                };
                
                this.synthesis.speak(utterance);
                
            } catch (error) {
                console.error('Speech synthesis failed:', error);
                this.showStatus('❌ Speech failed: ' + error.message);
            }
        }, 250);
    }

    // === MESSAGE HANDLING ===

    renderAllMessages() {
        if (!this.$.messages) return;
        this.$.messages.innerHTML = '';
        
        this.conversationHistory.forEach(msg => {
            this.renderMessageElement(msg, false, {});
        });
        
        setTimeout(() => this.scrollToBottom(), 100);
    }

    addMessage(content, sender, withSpeaker = false, provider = '', opts = {}) {
        const message = {
            role: sender === 'user' ? 'user' : 'assistant',
            content,
            provider,
            timestamp: new Date().toISOString()
        };
        
        this.conversationHistory.push(message);
        this.saveConversationHistory();
        this.renderMessageElement(message, withSpeaker, opts);
    }

    async renderMessageElement(message, withSpeaker = false, opts = {}) {
        const { content, role, provider } = message;
        const container = this.$.messages;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role === 'user' ? 'user-message' : 'jarvis-message'}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const isImage = typeof content === 'string' && content.trim().startsWith('<img');
        
        if (role === 'user' || isImage) {
            messageContent.innerHTML = role === 'user' ? this.escapeHtml(content) : content;
            messageDiv.appendChild(messageContent);
            container.appendChild(messageDiv);
            this.scrollToBottom();
            return;
        }
        
        if (opts.typewriter) {
            messageContent.textContent = '';
            messageDiv.appendChild(messageContent);
            container.appendChild(messageDiv);
            this.scrollToBottom();
            
            await this.typewriterRender(messageContent, content, opts.speed || 20);
            
            if (withSpeaker) {
                this.addSpeakerButton(messageDiv, content);
            }
            if (provider) {
                this.addProviderBadge(messageDiv, provider);
            }
            this.scrollToBottom();
            return;
        }
        
        messageContent.innerHTML = this.escapeHtml(content).replace(/\n/g, '<br>');
        messageDiv.appendChild(messageContent);
        
        if (withSpeaker) {
            this.addSpeakerButton(messageDiv, content);
        }
        if (provider) {
            this.addProviderBadge(messageDiv, provider);
        }
        
        container.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSpeakerButton(container, content) {
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'speaker-icon';
        speakerBtn.textContent = '🔊 Speak';
        speakerBtn.title = 'Speak response';
        speakerBtn.onclick = (e) => {
            e.preventDefault();
            this.speakText(content);
        };
        container.appendChild(speakerBtn);
    }

    addProviderBadge(container, provider) {
        const providerInfo = document.createElement('div');
        providerInfo.className = 'provider-info';
        providerInfo.textContent = `Provider: ${provider}`;
        container.appendChild(providerInfo);
    }

    escapeHtml(text = '') {
        return text.replace(/[&<>"']/g, function(match) {
            const entities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return entities[match];
        });
    }

    // === MESSAGE PROCESSING ===

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
        
        if (this.conversationHistory.length === 0) {
            this.collapseHeroThenHide();
        }
        
        this.typewriterUsed[this.currentMode] = false;
        
        this.isProcessing = true;
        this.updateSendButton();
        
        this.addMessage(message, 'user');
        this.$.messageInput.value = '';
        this.$.messageInput.style.height = '54px';
        this.updateInputPlaceholder();
        this.showTypingIndicator();
        this.showStatus(`Processing in ${this.currentMode} mode...`);
        
        if (this.currentMode === 'image') {
            this.showImageShimmer();
        }
        
        try {
            const response = await this.getResponseBasedOnMode(message);
            this.hideTypingIndicator();
            
            if (response.output_url) {
                this.hideImageShimmer();
                this.addMessage(`<img src="${response.output_url}" style="max-width:100%;border-radius:1rem;"/>`, 'jarvis', false, response.provider);
            } else {
                const useTypewriter = !this.typewriterUsed[this.currentMode];
                this.typewriterUsed[this.currentMode] = true;
                
                this.addMessage(
                    response.response || "No reply received.", 
                    'jarvis', 
                    true, 
                    response.provider,
                    { typewriter: useTypewriter, speed: 20 }
                );
            }
            
            this.showStatus('Response complete');
        } catch (error) {
            console.error('Error in processUserMessage:', error);
            this.hideTypingIndicator();
            this.hideImageShimmer();
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
                break;
            case 'search':
                endpoint = '/api/search';
                task = 'search';
                break;
            case 'image':
                task = 'image';
                if (this.currentImageAPI === 'huggingface') endpoint = '/api/image-huggingface';
                else if (this.currentImageAPI === 'kroki') endpoint = '/api/kroki';
                else endpoint = '/api/image-pollination';
                break;
            default:
                endpoint = '/api/chat';
                task = 'chat';
        }
        
        const payload = { 
            message: message, 
            history: this.conversationHistory.slice(-6), 
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

    // === CONVERSATION HISTORY ===

    saveConversationHistory() {
        if (this.sessions[this.currentSessionId]) {
            this.sessions[this.currentSessionId].messages = this.conversationHistory;
            this.sessions[this.currentSessionId].lastModified = new Date().toISOString();
            this.saveSessions();
            this.renderSessionsList();
        }
    }

    clearConversationHistory() {
        if (!confirm("Clear current session chat history?")) return;
        
        this.conversationHistory = [];
        if (this.sessions[this.currentSessionId]) {
            this.sessions[this.currentSessionId].messages = [];
            this.sessions[this.currentSessionId].lastModified = new Date().toISOString();
        }
        this.saveSessions();
        this.renderAllMessages();
        this.renderSessionsList();
        this.showStatus("Session cleared.");
        this.showHero();
        this.typewriterUsed = { chat: false, search: false, image: false };
    }

    // === UTILITY METHODS ===

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
        let placeholder = "";
        switch (this.currentMode) {
            case 'search':
                placeholder = "🔍 What would you like to search for on the web?";
                break;
            case 'image':
                if (this.currentImageAPI === 'kroki') placeholder = "📊 Describe a diagram (e.g., flowchart, sequence diagram)";
                else if (this.currentImageAPI === 'huggingface') placeholder = "🤖 Describe an image to generate...";
                else placeholder = "🎨 What image would you like to generate?";
                break;
            case 'settings':
                placeholder = "⚙️ Configure NOVA settings...";
                break;
            case 'analytics':
                placeholder = "📊 Ask about usage analytics...";
                break;
            case 'help':
                placeholder = "❓ Ask for help or available commands...";
                break;
            default:
                placeholder = "💬 Ask NOVA anything... (Ctrl+Space for voice)";
        }
        this.$.messageInput.placeholder = placeholder;
    }

    updateApiStatus(status) { 
        if (this.$.apiStatus) this.$.apiStatus.textContent = status; 
    }

    showStatus(text) { 
        if (this.$.statusBar) this.$.statusBar.textContent = text; 
    }

    showTypingIndicator() { 
        if (this.$.typingIndicator) {
            this.$.typingIndicator.style.display = 'flex'; 
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() { 
        if (this.$.typingIndicator) this.$.typingIndicator.style.display = 'none'; 
    }

    scrollToBottom() {
        setTimeout(() => {
            if (this.$.messages) {
                this.$.messages.scrollTop = this.$.messages.scrollHeight;
            }
        }, 50);
    }
}

// Initialize NOVA when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.jarvis = new JarvisAIUltimate();
        console.log("🤖 NOVA AI v7.2.1 Phase 2 - Complete System Loaded & Ready");
    });
} else {
    window.jarvis = new JarvisAIUltimate();
    console.log("🤖 NOVA AI v7.2.1 Phase 2 - Complete System Loaded & Ready");
}
