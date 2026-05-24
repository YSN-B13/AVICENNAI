const state = {
    messages: [],
    isLoading: false,
    hasStarted: false,
    currentImage: null
};

const el = {};

function initElements() {
    el.header              = document.getElementById('header');
    el.backbtn             = document.getElementById('back-btn');
    el.main                = document.getElementById('main');
    el.welcomeScreen       = document.getElementById('welcome-screen');
    el.chatContainer       = document.getElementById('chat-container');
    el.inputContainer      = document.getElementById('input-container');
    el.messagesList        = document.getElementById('messages');
    el.chatForm            = document.getElementById('chat-form');
    el.messageInput        = document.getElementById('message-input');
    el.fileInput           = document.getElementById('file-input');
    el.sendBtn             = document.getElementById('send-btn');
    el.startBtn            = document.getElementById('start-btn');
    el.backBtn             = document.getElementById('back-btn');
    el.uploadBtn           = document.getElementById('upload-btn');
    el.imagePreviewWrapper = document.getElementById('image-preview-container');
    el.imagePreview        = document.getElementById('image-preview');
    el.removeImageBtn      = document.getElementById('remove-image-btn');
    el.sendIcon            = document.getElementById('send-icon');
    el.loadingIcon         = document.getElementById('loading-icon');
    el.scrollBottomBtn     = document.getElementById('scroll-bottom-btn');
    el.themeToggleBtn      = document.getElementById('theme-toggle');
    el.themelogo           = document.getElementById('theme-logo');
    el.welcomeThemeToggle  = document.getElementById('welcome-theme-toggle');
    el.sunIcons  = document.querySelectorAll('.sun-icon');
    el.moonIcons = document.querySelectorAll('.moon-icon');
    el.sunIcon   = el.sunIcons[0];
    el.moonIcon  = el.moonIcons[0];
}

function formatContent(content) {
    if (!content) return '';
    try { return marked.parse(content); }
    catch { return content; }
}

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

function lucideIcon(name, extraClass = '') {
    const toCamel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const iconKey = toCamel(name).replace(/^\w/, c => c.toUpperCase());

    if (window.lucide && window.lucide[iconKey]) {
        const iconData = window.lucide[iconKey];
        const attrs    = iconData[1] || {};
        const children = iconData[2] || [];

        const buildEl = (node) => {
            if (!Array.isArray(node) || node.length < 2) return null;
            const [tag, a, nested] = node;
            const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
            Object.entries(a || {}).forEach(([k, v]) => el.setAttribute(k, v));
            if (Array.isArray(nested)) {
                nested.forEach(child => {
                    const childEl = buildEl(child);
                    if (childEl) el.appendChild(childEl);
                });
            }
            return el;
        };

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        Object.entries({
            ...attrs,
            fill:              'none',
            stroke:            'currentColor',
            'stroke-width':    '2',
            'stroke-linecap':  'round',
            'stroke-linejoin': 'round',
        }).forEach(([k, v]) => svg.setAttribute(k, v));
        if (extraClass) svg.setAttribute('class', extraClass);

        children.forEach(child => {
            const el = buildEl(child);
            if (el) svg.appendChild(el);
        });

        return svg.outerHTML;
    }

    return `<i data-lucide="${name}"${extraClass ? ` class="${extraClass}"` : ''}></i>`;
}

function handleScrollVisibility() {
    if (!el.chatContainer || !el.scrollBottomBtn) return;
    const { scrollTop, scrollHeight, clientHeight } = el.chatContainer;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
    el.scrollBottomBtn.classList.toggle('visible', !isNearBottom);
}

function updateSendButton() {
    const hasContent = el.messageInput.value.trim() || state.currentImage;
    const disabled   = !hasContent || state.isLoading;

    el.sendBtn.disabled = disabled;
    el.sendBtn.classList.toggle('active', !disabled);

    el.sendIcon.classList.toggle('hidden', state.isLoading);
    el.loadingIcon.classList.toggle('hidden', !state.isLoading);
}

function adjustTextareaHeight() {
    const ta = el.messageInput;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
}


function renderMessage(msg) {
    const isUser = msg.role === 'user';

    const wrap = document.createElement('div');
    wrap.className = `chat-message ${isUser ? 'user' : 'assistant'}`;
    wrap.setAttribute('data-message-id', msg.id);

    const imageHtml = msg.image
        ? `<img src="${msg.image}" alt="Image médicale jointe" class="message-image">`
        : '';

    wrap.innerHTML = `
        <div class="avatar ${isUser ? 'avatar-user' : 'avatar-ai'}">
            ${isUser
                ? '<i class="fa-solid fa-user"></i>'
                : '<i class="fa-solid fa-stethoscope"></i>'
            }
        </div>
        <div class="message-content ${isUser ? 'message-user' : 'message-ai'}">
            ${imageHtml}
            <div class="prose">${formatContent(msg.content)}</div>
        </div>
    `;

    return wrap;  
}

function renderGreeting() {
    const wrap = document.createElement('div');
    wrap.className = 'greeting-message';
    wrap.innerHTML = `
        <div class="greeting-card">
            <div class="greeting-icon-wrap">
                <i class="fa-solid fa-stethoscope"></i>
            </div>
            <span class="greeting-eyebrow">Assistant Médical IA</span>
            <div class="greeting-divider"></div>
            <p>Je suis <strong>AvicennAI</strong>, votre assistant médical. Posez-moi une question ou partagez une image médicale pour commencer.</p>
        </div>
    `;

    return wrap;
}

function renderTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.id = 'typing-indicator';
    wrap.className = 'typing-message';

    wrap.innerHTML = `
        <div class="avatar avatar-ai">
            ${lucideIcon('sparkles')}
        </div>
        <div class="typing-bubble">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    if (window.lucide && wrap.querySelector('[data-lucide]')) {
        lucide.createIcons({ context: wrap });
    }

    return wrap;
}

function renderMessages() {
    el.messagesList.innerHTML = '';

    if (state.messages.length === 0) {
        el.messagesList.appendChild(renderGreeting());
    }

    state.messages.forEach(msg => el.messagesList.appendChild(renderMessage(msg)));
    if (state.isLoading) el.messagesList.appendChild(renderTypingIndicator());
    scrollToBottom(false);
}

function updateAssistantMessage(id, content) {
    const wrap = el.messagesList.querySelector(`[data-message-id="${id}"]`);
    if (wrap) {
        const prose = wrap.querySelector('.prose');
        if (prose) prose.innerHTML = formatContent(content);
    }
    scrollToBottom();
}

async function streamChat(messages) {
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });

        if (!res.ok) throw new Error(`Erreur ${res.status}`);

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent    = '';
        let assistantMessageId  = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });

            for (const line of chunk.split('\n')) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') continue;

                try {
                    const parsed  = JSON.parse(jsonStr);
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (content) {
                        assistantContent += content;

                        if (!assistantMessageId) {
                            assistantMessageId = generateId();
                            const msg = { id: assistantMessageId, content: assistantContent, role: 'assistant' };
                            state.messages.push(msg);

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

async function handleSendMessage(content, image) {
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

function handleStart() {
    el.welcomeScreen.style.opacity    = '0';
    el.welcomeScreen.style.transform  = 'scale(0.97)';
    el.welcomeScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    setTimeout(() => {
        state.hasStarted = true;

        el.welcomeScreen.classList.add('hidden');
        el.welcomeScreen.style.cssText = '';

        if (el.welcomeThemeToggle) el.welcomeThemeToggle.classList.add('chat-hidden');

        el.header.classList.remove('hidden');
        el.backbtn.classList.remove('hidden');
        el.main.classList.add('chat-active');

        el.chatContainer.classList.remove('hidden');
        el.inputContainer.classList.remove('hidden');

        renderMessages();
        el.messageInput.focus();
    }, 300);
}

function handleBack() {
    [el.chatContainer, el.inputContainer].forEach(e => {
        e.style.opacity    = '0';
        e.style.transition = 'opacity 0.25s ease';
    });

    setTimeout(() => {
        state.hasStarted   = false;
        state.messages     = [];
        state.currentImage = null;

        el.backbtn.classList.add('hidden');
        el.main.classList.remove('chat-active');

        if (el.welcomeThemeToggle) el.welcomeThemeToggle.classList.remove('chat-hidden');

        el.chatContainer.classList.add('hidden');
        el.inputContainer.classList.add('hidden');

        el.chatContainer.style.cssText  = '';
        el.inputContainer.style.cssText = '';

        el.welcomeScreen.classList.remove('hidden');

        el.messagesList.innerHTML   = '';
        el.messageInput.value       = '';
        el.messageInput.style.height = 'auto';

        el.imagePreviewWrapper.classList.add('hidden');
        el.imagePreview.src = '';
        el.fileInput.value  = '';

        updateSendButton();
    }, 260);
}

function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

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
    reader.onerror = () => { showToast('Erreur de lecture du fichier', 'error'); };
    reader.readAsDataURL(file);
}

function handleRemoveImage() {
    state.currentImage = null;
    el.imagePreview.src = '';
    el.imagePreviewWrapper.classList.add('hidden');
    el.fileInput.value  = '';
    updateSendButton();
}

function handleFormSubmit(e) {
    e.preventDefault();

    const content = el.messageInput.value.trim();
    const image   = state.currentImage;

    if ((!content && !image) || state.isLoading) return;

    handleSendMessage(content, image);

    el.messageInput.value       = '';
    el.messageInput.style.height = 'auto';
    state.currentImage          = null;
    el.imagePreview.src         = '';
    el.imagePreviewWrapper.classList.add('hidden');
    el.fileInput.value          = '';

    updateSendButton();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
    }
}

function updateThemeIcons(isDark) {
    el.sunIcons.forEach(i => i.classList.toggle('hidden', isDark));
    el.moonIcons.forEach(i => i.classList.toggle('hidden', !isDark));
}

function applyTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.replace('light', 'dark');
        localStorage.setItem('theme', 'dark');

        el.themelogo.src = "/static/imgs/logodark.png";
    } else {
        document.documentElement.classList.replace('dark', 'light');
        localStorage.setItem('theme', 'light');

        el.themelogo.src = "/static/imgs/logolight.png";
    }

    updateThemeIcons(isDark);
}

function initTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    updateThemeIcons(isDark);
}

function initEventListeners() {
    if (el.themeToggleBtn) {
        el.themeToggleBtn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            applyTheme(!isDark);
        });
    }
    if (el.welcomeThemeToggle) {
        el.welcomeThemeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            applyTheme(!isDark);
        });
    }

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

    if (el.chatContainer) {
        el.chatContainer.addEventListener('scroll', handleScrollVisibility);
    }
    if (el.scrollBottomBtn) {
        el.scrollBottomBtn.addEventListener('click', () => scrollToBottom(true));
    }
}

function init() {
    initElements();
    if (window.lucide) lucide.createIcons();
    
    initTheme();
    initEventListeners();
    updateSendButton();
}

document.addEventListener('DOMContentLoaded', init);
