/**
 * AvicennAI — Production Frontend
 * AI Solution Morocco
 */

// ── State ────────────────────────────────────────────────────
const state = {
    messages: [],
    isLoading: false,
    hasStarted: false,
    currentImage: null
};

// ── DOM refs ─────────────────────────────────────────────────
const el = {};

function initElements() {
    el.header = document.getElementById('header');
    el.main = document.getElementById('main');
    el.welcomeScreen = document.getElementById('welcome-screen');
    el.chatContainer = document.getElementById('chat-container');
    el.inputContainer = document.getElementById('input-container');
    el.messagesList = document.getElementById('messages');
    el.chatForm = document.getElementById('chat-form');
    el.messageInput = document.getElementById('message-input');
    el.fileInput = document.getElementById('file-input');
    el.sendBtn = document.getElementById('send-btn');
    el.startBtn = document.getElementById('start-btn');
    el.backBtn = document.getElementById('back-btn');
    el.uploadBtn = document.getElementById('upload-btn');
    el.imagePreviewWrapper = document.getElementById('image-preview-container');
    el.imagePreview = document.getElementById('image-preview');
    el.removeImageBtn = document.getElementById('remove-image-btn');
    el.sendIcon = document.getElementById('send-icon');
    el.loadingIcon = document.getElementById('loading-icon');
    el.scrollBottomBtn = document.getElementById('scroll-bottom-btn');
}

// ── Markdown ─────────────────────────────────────────────────
function formatContent(content) {
    if (!content) return '';
    try { return marked.parse(content); }
    catch { return content; }
}

// ── Helpers ──────────────────────────────────────────────────
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function scrollToBottom(smooth = true) {
    if (!el.chatContainer) return;
    el.chatContainer.scrollTo({
        top: el.chatContainer.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant'
    });
}

// ── Scroll-to-bottom button visibility ───────────────────────
function handleScrollVisibility() {
    if (!el.chatContainer || !el.scrollBottomBtn) return;
    const { scrollTop, scrollHeight, clientHeight } = el.chatContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    el.scrollBottomBtn.classList.toggle('visible', !isNearBottom);
}

// ── Send button state ─────────────────────────────────────────
function updateSendButton() {
    const hasContent = el.messageInput.value.trim() || state.currentImage;
    const disabled = !hasContent || state.isLoading;

    el.sendBtn.disabled = disabled;
    el.sendBtn.classList.toggle('active', !disabled);

    el.sendIcon.classList.toggle('hidden', state.isLoading);
    el.loadingIcon.classList.toggle('hidden', !state.isLoading);
}

// ── Auto-grow textarea ────────────────────────────────────────
function adjustTextareaHeight() {
    const ta = el.messageInput;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
}

// ── Render a message bubble ───────────────────────────────────
function renderMessage(msg) {
    const isUser = msg.role === 'user';

    const wrap = document.createElement('div');
    wrap.className = `chat-message ${isUser ? 'user' : 'assistant'}`;
    wrap.setAttribute('data-message-id', msg.id);

    const userIcon = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>`;

    const aiIcon = `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
    </svg>`;

    const imageHtml = msg.image
        ? `<img src="${msg.image}" alt="Image médicale jointe" class="message-image">`
        : '';

    wrap.innerHTML = `
        <div class="avatar ${isUser ? 'avatar-user' : 'avatar-ai'}">
            ${isUser ? userIcon : aiIcon}
        </div>
        <div class="message-content ${isUser ? 'message-user' : 'message-ai'}">
            ${imageHtml}
            <div class="prose">${formatContent(msg.content)}</div>
        </div>
    `;

    return wrap;
}

// ── Render greeting message (shown when chat starts) ──────────
function renderGreeting() {
    const wrap = document.createElement('div');
    wrap.className = 'greeting-message';
    wrap.innerHTML = `
        <div class="greeting-card">
            <div class="greeting-icon-wrap">
                <svg class="greeting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 11v4m-2-2h4" />
                </svg>
            </div>
            <span class="greeting-eyebrow">Assistant Médical IA</span>
            <div class="greeting-divider"></div>
            <p>Je suis <strong>AvicennAI</strong>, votre assistant médical. Posez-moi une question ou partagez une image médicale pour commencer.</p>
        </div>
    `;
    return wrap;
}

// ── Render typing indicator ───────────────────────────────────
function renderTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.id = 'typing-indicator';
    wrap.className = 'typing-message';

    wrap.innerHTML = `
        <div class="avatar avatar-ai">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
        </div>
        <div class="typing-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    return wrap;
}

// ── Render all messages ───────────────────────────────────────
function renderMessages() {
    el.messagesList.innerHTML = '';

    // Show greeting if no messages yet
    if (state.messages.length === 0) {
        el.messagesList.appendChild(renderGreeting());
    }

    state.messages.forEach(msg => el.messagesList.appendChild(renderMessage(msg)));
    if (state.isLoading) el.messagesList.appendChild(renderTypingIndicator());
    scrollToBottom(false);
}

// ── Update streaming assistant message ───────────────────────
function updateAssistantMessage(id, content) {
    const wrap = el.messagesList.querySelector(`[data-message-id="${id}"]`);
    if (wrap) {
        const prose = wrap.querySelector('.prose');
        if (prose) prose.innerHTML = formatContent(content);
    }
    scrollToBottom();
}

// ── Stream from API ───────────────────────────────────────────
async function streamChat(messages) {
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let assistantMessageId = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            for (const line of chunk.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                        assistantContent += content;

                        if (!assistantMessageId) {
                            assistantMessageId = generateId();
                            const msg = { id: assistantMessageId, content: assistantContent, role: 'assistant' };
                            state.messages.push(msg);

                            // Remove greeting if still present
                            const greeting = el.messagesList.querySelector('.greeting-message');
                            if (greeting) greeting.remove();

                            document.getElementById('typing-indicator')?.remove();
                            el.messagesList.appendChild(renderMessage(msg));
                        } else {
                            const i = state.messages.findIndex(m => m.id === assistantMessageId);
                            if (i !== -1) {
                                state.messages[i].content = assistantContent;
                                updateAssistantMessage(assistantMessageId, assistantContent);
                            }
                        }
                    }
                } catch { /* skip malformed chunk */ }
            }
        }
    } catch (err) {
        console.error('Stream error:', err);
        showToast('Erreur de connexion au service', 'error');
    }
}

// ── Toast (with fade-out) ─────────────────────────────────────
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 2500);
}

// ── Send message ──────────────────────────────────────────────
async function handleSendMessage(content, image) {
    // Remove greeting on first message
    const greeting = el.messagesList.querySelector('.greeting-message');
    if (greeting) greeting.remove();

    const userMsg = {
        id: generateId(),
        content: content,
        role: 'user',
        image: image || undefined
    };

    state.messages.push(userMsg);
    state.isLoading = true;

    renderMessages();
    updateSendButton();

    const apiMessages = state.messages.map(msg => {
        if (msg.image) {
            return {
                role: msg.role,
                content: [
                    { type: 'text', text: msg.content },
                    { type: 'image_url', image_url: { url: msg.image } }
                ]
            };
        }
        return { role: msg.role, content: msg.content };
    });

    await streamChat(apiMessages);

    state.isLoading = false;
    document.getElementById('typing-indicator')?.remove();
    updateSendButton();
    scrollToBottom();
}

// ── Start chat ────────────────────────────────────────────────
function handleStart() {
    el.welcomeScreen.style.opacity = '0';
    el.welcomeScreen.style.transform = 'scale(0.97)';
    el.welcomeScreen.style.transition = 'opacity 0.35s ease, transform 0.35s ease';

    setTimeout(() => {
        state.hasStarted = true;

        el.welcomeScreen.classList.add('hidden');
        el.welcomeScreen.style.cssText = '';

        el.header.classList.remove('hidden');
        el.main.classList.add('chat-active');

        el.chatContainer.classList.remove('hidden');
        el.inputContainer.classList.remove('hidden');

        renderMessages();
        el.messageInput.focus();
    }, 350);
}

// ── Go back to welcome ────────────────────────────────────────
function handleBack() {
    [el.chatContainer, el.inputContainer].forEach(e => {
        e.style.opacity = '0';
        e.style.transition = 'opacity 0.3s ease';
    });

    setTimeout(() => {
        state.hasStarted = false;
        state.messages = [];
        state.currentImage = null;

        el.header.classList.add('hidden');
        el.main.classList.remove('chat-active');

        el.chatContainer.classList.add('hidden');
        el.inputContainer.classList.add('hidden');

        el.chatContainer.style.cssText = '';
        el.inputContainer.style.cssText = '';

        el.welcomeScreen.classList.remove('hidden');

        el.messagesList.innerHTML = '';
        el.messageInput.value = '';
        el.messageInput.style.height = 'auto';

        el.imagePreviewWrapper.classList.add('hidden');
        el.imagePreview.src = '';
        el.fileInput.value = '';

        updateSendButton();
    }, 320);
}

// ── Image upload ──────────────────────────────────────────────
function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image trop volumineuse (max 10 Mo)', 'error');
        el.fileInput.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        state.currentImage = reader.result;
        el.imagePreview.src = reader.result;
        el.imagePreviewWrapper.classList.remove('hidden');
        updateSendButton();
    };
    reader.onerror = () => {
        showToast('Erreur de lecture du fichier', 'error');
    };
    reader.readAsDataURL(file);
}

function handleRemoveImage() {
    state.currentImage = null;
    el.imagePreview.src = '';
    el.imagePreviewWrapper.classList.add('hidden');
    el.fileInput.value = '';
    updateSendButton();
}

// ── Form submit ───────────────────────────────────────────────
function handleFormSubmit(e) {
    e.preventDefault();

    const content = el.messageInput.value.trim();
    const image = state.currentImage;

    if ((!content && !image) || state.isLoading) return;

    handleSendMessage(content, image);

    // Reset input
    el.messageInput.value = '';
    el.messageInput.style.height = 'auto';
    state.currentImage = null;
    el.imagePreview.src = '';
    el.imagePreviewWrapper.classList.add('hidden');
    el.fileInput.value = '';

    updateSendButton();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
    }
}

// ── Event listeners ───────────────────────────────────────────
function initEventListeners() {
    el.startBtn.addEventListener('click', handleStart);
    el.backBtn.addEventListener('click', handleBack);

    el.uploadBtn.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', handleImageUpload);
    el.removeImageBtn.addEventListener('click', handleRemoveImage);

    el.chatForm.addEventListener('submit', handleFormSubmit);

    el.messageInput.addEventListener('input', () => {
        adjustTextareaHeight();
        updateSendButton();
    });
    el.messageInput.addEventListener('keydown', handleKeyDown);

    // Scroll-to-bottom button
    if (el.chatContainer) {
        el.chatContainer.addEventListener('scroll', handleScrollVisibility);
    }
    if (el.scrollBottomBtn) {
        el.scrollBottomBtn.addEventListener('click', () => scrollToBottom(true));
    }
}

// ── Boot ──────────────────────────────────────────────────────
function init() {
    initElements();
    initEventListeners();
    updateSendButton();
}

document.addEventListener('DOMContentLoaded', init);