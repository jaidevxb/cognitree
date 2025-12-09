class ChatManager {
    constructor(game) {
        this.game = game;
        this.panel = document.getElementById('chatPanel');
        this.messagesContainer = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.toggleBtn = document.getElementById('toggleChatBtn');

        this.history = [];
        this.isCollapsed = false;

        // Hide initially
        this.panel.style.display = 'none';

        // Listen for tree growth event
        window.addEventListener('treeGrown', () => {
            this.showChatbot();
        });

        this.setupEventListeners();
    }

    showChatbot() {
        this.panel.style.display = 'flex';
        // Add welcome message if not already present
        if (this.history.length === 0) {
            // this.addMessage('Hello! The tree has grown. I am here to help you explore further.', 'system');
        }
    }

    setupEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.toggleBtn.addEventListener('click', () => this.togglePanel());
    }

    togglePanel() {
        this.isCollapsed = !this.isCollapsed;
        this.panel.classList.toggle('collapsed', this.isCollapsed);

        if (this.isCollapsed) {
            // Save current manual size if it exists, otherwise use computed style
            const rect = this.panel.getBoundingClientRect();
            // Only save if it looks like it might have been manually resized (larger than default/min)
            // Default width is 300px, min height 200px
            if (rect.width > 300 || rect.height > 200) {
                this.prevWidth = rect.width + 'px';
                this.prevHeight = rect.height + 'px';
            } else {
                this.prevWidth = '';
                this.prevHeight = '';
            }

            // FORCE strict overwrite of any inline styles that might cause the "huge rectangle"
            this.panel.style.width = '48px';
            this.panel.style.height = '48px';
            this.panel.style.resize = 'none'; // Disable resize when collapsed

            this.toggleBtn.innerHTML = '<i class="fas fa-comment-dots"></i>';
            this.toggleBtn.title = "Open Chat";
        } else {
            // Restore previous manual size if it existed
            if (this.prevWidth && this.prevHeight) {
                this.panel.style.width = this.prevWidth;
                this.panel.style.height = this.prevHeight;
            } else {
                // Clear inline styles to let CSS take over for default state
                this.panel.style.width = '';
                this.panel.style.height = '';
            }

            this.panel.style.resize = 'both'; // Re-enable resize when expanded

            this.toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            this.toggleBtn.title = "Close Chat";
        }
    }

    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;

        // Add user message
        this.addMessage(text, 'user');
        this.input.value = '';

        // Add to history
        this.history.push({ sender: 'user', text: text });

        // Show loading indicator
        const loadingId = this.addLoadingMessage();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    history: this.history.slice(-10) // Send last 10 messages context
                })
            });

            const data = await response.json();

            // Remove loading indicator
            this.removeMessage(loadingId);

            if (data.error) {
                this.addMessage('Error: ' + data.error, 'system');
            } else {
                this.addMessage(data.response, 'assistant');
                this.history.push({ sender: 'model', text: data.response });
            }

        } catch (error) {
            this.removeMessage(loadingId);
            this.addMessage('Error connecting to assistant.', 'system');
        }
    }

    addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
        return div.id = 'msg_' + Date.now();
    }

    addLoadingMessage() {
        const div = document.createElement('div');
        div.className = 'message assistant loading';
        div.textContent = 'Thinking...';
        this.messagesContainer.appendChild(div);
        this.scrollToBottom();
        return div.id = 'loading_' + Date.now();
    }

    removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}
