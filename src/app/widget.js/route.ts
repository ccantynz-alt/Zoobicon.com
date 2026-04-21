/**
 * Serves /widget.js — the drop-in chat widget script customers embed on their sites.
 * Customers add: <script src="https://zoobicon.com/widget.js" data-site-id="xxx"></script>
 */

const WIDGET_SCRIPT = `(function() {
  'use strict';

  // Prevent double-injection
  if (window.__zoobiconWidget) return;
  window.__zoobiconWidget = true;

  var script = document.currentScript || document.querySelector('script[src*="widget.js"]');
  var siteId = script && script.getAttribute('data-site-id') || '';
  var botName = script && script.getAttribute('data-bot-name') || 'Assistant';
  var primaryColor = script && script.getAttribute('data-color') || '#6d5dfc';
  var context = script && script.getAttribute('data-context') || '';
  var apiUrl = (script && script.getAttribute('data-api') || window.location.protocol + '//zoobicon.com') + '/api/widget/chat';

  var isOpen = false;
  var history = [];

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.zbc-w-root { position: fixed; bottom: 20px; right: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }',
    '.zbc-w-btn { width: 56px; height: 56px; border-radius: 50%; background: ' + primaryColor + '; border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; color: white; transition: transform 0.2s; }',
    '.zbc-w-btn:hover { transform: scale(1.05); }',
    '.zbc-w-btn svg { width: 24px; height: 24px; }',
    '.zbc-w-panel { position: absolute; bottom: 72px; right: 0; width: 360px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100vh - 100px); background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; }',
    '.zbc-w-header { padding: 16px 20px; background: ' + primaryColor + '; color: white; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }',
    '.zbc-w-close { background: none; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0 4px; }',
    '.zbc-w-msgs { flex: 1; overflow-y: auto; padding: 16px; background: #f8f9fa; }',
    '.zbc-w-msg { margin-bottom: 12px; display: flex; }',
    '.zbc-w-msg.user { justify-content: flex-end; }',
    '.zbc-w-bubble { max-width: 80%; padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }',
    '.zbc-w-msg.bot .zbc-w-bubble { background: white; color: #1a1a1a; border: 1px solid #e5e7eb; border-bottom-left-radius: 4px; }',
    '.zbc-w-msg.user .zbc-w-bubble { background: ' + primaryColor + '; color: white; border-bottom-right-radius: 4px; }',
    '.zbc-w-input-row { padding: 12px; background: white; border-top: 1px solid #e5e7eb; display: flex; gap: 8px; }',
    '.zbc-w-input { flex: 1; padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 14px; outline: none; font-family: inherit; }',
    '.zbc-w-input:focus { border-color: ' + primaryColor + '; }',
    '.zbc-w-send { background: ' + primaryColor + '; color: white; border: none; border-radius: 20px; padding: 0 16px; cursor: pointer; font-weight: 600; font-size: 14px; }',
    '.zbc-w-send:disabled { opacity: 0.5; cursor: not-allowed; }',
    '.zbc-w-typing { padding: 10px 14px; background: white; border: 1px solid #e5e7eb; border-radius: 16px; display: inline-block; }',
    '.zbc-w-typing span { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #999; margin: 0 1px; animation: zbc-w-bounce 1.2s infinite; }',
    '.zbc-w-typing span:nth-child(2) { animation-delay: 0.15s; }',
    '.zbc-w-typing span:nth-child(3) { animation-delay: 0.3s; }',
    '@keyframes zbc-w-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-6px); opacity: 1; } }',
  ].join('\\n');
  document.head.appendChild(style);

  // Build DOM
  var root = document.createElement('div');
  root.className = 'zbc-w-root';
  root.innerHTML =
    '<button class="zbc-w-btn" id="zbc-w-toggle" aria-label="Open chat">' +
    '<svg fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>' +
    '</button>' +
    '<div class="zbc-w-panel" id="zbc-w-panel" style="display:none;">' +
    '<div class="zbc-w-header"><span>' + botName + '</span><button class="zbc-w-close" id="zbc-w-close" aria-label="Close chat">×</button></div>' +
    '<div class="zbc-w-msgs" id="zbc-w-msgs"></div>' +
    '<div class="zbc-w-input-row">' +
    '<input class="zbc-w-input" id="zbc-w-input" placeholder="Type your message..." />' +
    '<button class="zbc-w-send" id="zbc-w-send">Send</button>' +
    '</div>' +
    '</div>';
  document.body.appendChild(root);

  var toggleBtn = document.getElementById('zbc-w-toggle');
  var closeBtn = document.getElementById('zbc-w-close');
  var panel = document.getElementById('zbc-w-panel');
  var msgs = document.getElementById('zbc-w-msgs');
  var input = document.getElementById('zbc-w-input');
  var sendBtn = document.getElementById('zbc-w-send');

  function togglePanel() {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'flex' : 'none';
    if (isOpen && history.length === 0) {
      addMessage('bot', 'Hi! How can I help you today?');
    }
    if (isOpen) input.focus();
  }

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'zbc-w-msg ' + role;
    var bubble = document.createElement('div');
    bubble.className = 'zbc-w-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTyping() {
    var div = document.createElement('div');
    div.className = 'zbc-w-msg bot';
    div.id = 'zbc-w-typing-indicator';
    div.innerHTML = '<div class="zbc-w-typing"><span></span><span></span><span></span></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    var el = document.getElementById('zbc-w-typing-indicator');
    if (el) el.remove();
  }

  function send() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    addMessage('user', text);
    history.push({ role: 'user', content: text });
    addTyping();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: siteId,
        message: text,
        history: history.slice(-10),
        context: context,
        name: botName,
      }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        removeTyping();
        var reply = data.reply || data.error || 'Sorry, I had trouble responding.';
        addMessage('bot', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function() {
        removeTyping();
        addMessage('bot', 'Something went wrong. Please try again.');
      })
      .finally(function() {
        sendBtn.disabled = false;
        input.focus();
      });
  }

  toggleBtn.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
})();`;

export async function GET() {
  return new Response(WIDGET_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
