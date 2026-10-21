/**
 * HerbIT - Santhamithra AI Assistant Client (assistant.js)
 */

let conversationHistory = [];

// DOM Elements
const chatViewport = document.getElementById('chat-viewport');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const sendIcon = document.getElementById('send-icon');
const sendSpinner = document.getElementById('send-spinner');
const includeGardenContextCheckbox = document.getElementById('include-garden-context');
const suggestionsBar = document.getElementById('suggestions-bar');
const clearChatBtn = document.getElementById('clear-chat-btn');
const charCounter = document.getElementById('char-counter');

const logoutBtn = document.getElementById('logout-btn');
const mobileToggle = document.getElementById('mobile-toggle');
const navMenu = document.getElementById('nav-menu');

document.addEventListener('DOMContentLoaded', () => {
  initAssistant();
});

function initAssistant() {
  setupEventListeners();
  scrollChatToBottom();
}

function setupEventListeners() {
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => navMenu.classList.toggle('open'));
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login.html';
      } catch (err) {
        window.location.href = '/login.html';
      }
    });
  }

  // Send message on Enter key (Shift+Enter allows newline if textarea)
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Character counter
  chatInput.addEventListener('input', () => {
    const len = chatInput.value.length;
    if (charCounter) {
      charCounter.textContent = `${len} / 1000`;
    }
  });

  // Send button
  btnSend.addEventListener('click', sendMessage);

  // Suggested questions chips
  if (suggestionsBar) {
    suggestionsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.suggestion-chip');
      if (!chip) return;
      const prompt = chip.dataset.prompt;
      if (prompt) {
        chatInput.value = prompt;
        if (charCounter) {
          charCounter.textContent = `${prompt.length} / 1000`;
        }
        chatInput.focus();
        sendMessage();
      }
    });
  }

  // Reset chat session
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
      conversationHistory = [];
      chatViewport.innerHTML = `
        <div class="chat-message-row model">
          <div class="chat-bubble model">
            <div class="ai-header">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Santhamithra AI</span>
            </div>
            <p><strong>Chat session reset.</strong></p>
            <p>Hello! I'm ready for your questions. Ask anything about soil mixtures, watering schedules, propagation, or medicinal herbs in your garden.</p>
          </div>
        </div>
      `;
      scrollChatToBottom();
    });
  }
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Append user bubble
  appendBubble('user', text);
  chatInput.value = '';
  if (charCounter) {
    charCounter.textContent = '0 / 1000';
  }

  // Set loading state
  setLoading(true);

  // Placeholder thinking bubble
  const thinkingBubbleRow = appendThinkingBubble();

  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory,
        includeGardenContext: includeGardenContextCheckbox ? includeGardenContextCheckbox.checked : true
      })
    });

    const data = await res.json();
    thinkingBubbleRow.remove();

    if (res.ok && data.reply) {
      appendBubble('model', data.reply);

      // Record in conversation history
      conversationHistory.push({ role: 'user', text: text });
      conversationHistory.push({ role: 'model', text: data.reply });

      // Keep recent 10 turns
      if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
      }
    } else {
      appendBubble('model', data.reply || data.message || '⚠️ An error occurred connecting to Santhamithra AI. Please try again.');
    }
  } catch (err) {
    thinkingBubbleRow.remove();
    console.error('AI chat network error:', err);
    appendBubble('model', '⚠️ Unable to reach the server. Please check your network connection and try again.');
  } finally {
    setLoading(false);
    chatInput.focus();
    scrollChatToBottom();
  }
}

function appendBubble(role, rawContent) {
  const row = document.createElement('div');
  row.className = `chat-message-row ${role}`;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;

  if (role === 'user') {
    bubble.textContent = rawContent;
  } else {
    const headerHtml = `
      <div class="ai-header">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        <span>Santhamithra AI</span>
      </div>
    `;
    bubble.innerHTML = headerHtml + renderSimpleMarkdown(rawContent);
  }

  row.appendChild(bubble);
  chatViewport.appendChild(row);
  scrollChatToBottom();
  return row;
}

function appendThinkingBubble() {
  const row = document.createElement('div');
  row.className = 'chat-message-row model';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble model';
  bubble.innerHTML = `
    <div class="ai-header">
      <i class="fa-solid fa-seedling fa-bounce" style="color:var(--accent);"></i>
      <span>Santhamithra AI is thinking...</span>
    </div>
    <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">
      Reviewing botanical records and preparing guidance...
    </p>
  `;

  row.appendChild(bubble);
  chatViewport.appendChild(row);
  scrollChatToBottom();
  return row;
}

function scrollChatToBottom() {
  if (chatViewport) {
    chatViewport.scrollTop = chatViewport.scrollHeight;
  }
}

function setLoading(isLoading) {
  btnSend.disabled = isLoading;
  chatInput.disabled = isLoading;
  sendIcon.style.display = isLoading ? 'none' : 'inline-block';
  sendSpinner.style.display = isLoading ? 'inline-block' : 'none';
}

/**
 * Lightweight, safe client-side Markdown parser for botanical formatting
 */
function renderSimpleMarkdown(text) {
  if (!text) return '';

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Clean out any accidental non-English greetings if returned by API
  html = html.replace(/\bNamaste(!|\b)/gi, 'Hello$1');

  // Headers: ### Header
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');

  // Horizontal rules: ---
  html = html.replace(/^\s*---\s*$/gim, '<hr/>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Inline code `code`
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  // Unordered list items: * item or - item
  html = html.replace(/^\s*[\*\-]\s+(.*$)/gim, '<li>$1</li>');

  // Wrap list items in <ul>
  html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Convert double linebreaks to paragraphs
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h3>') || trimmed.startsWith('<h4>') || trimmed.startsWith('<ul>') || trimmed.startsWith('<hr/>')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('');

  return html;
}
