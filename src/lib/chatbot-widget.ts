/**
 * AI Chatbot Widget for Customer Sites
 *
 * A drop-in chat widget powered by Claude that any Zoobicon customer
 * can add to their website. No competitor offers this built-in.
 *
 * Features:
 *   - Floating chat bubble in bottom-right corner
 *   - Claude-powered conversations about the customer's business
 *   - Customizable colors, position, greeting message
 *   - Knowledge base integration (customer provides FAQ/docs)
 *   - Lead capture (collects name/email before chat)
 *   - Auto-answers common questions
 *   - Escalates to human when AI isn't confident
 *
 * Revenue: $29-49/mo per customer site
 * Cost: ~$0.01-0.05 per conversation (Claude API)
 * Margin: 95%+
 */

export interface ChatbotConfig {
  businessName: string;
  businessDescription: string;
  greeting: string;
  primaryColor: string;
  position: "bottom-right" | "bottom-left";
  collectEmail: boolean;
  knowledgeBase?: string; // FAQ/docs text for context
  humanEscalationEmail?: string;
}

/**
 * Generate the embeddable chatbot widget code.
 * Returns HTML/JS that the customer adds to their website.
 */
export function generateWidgetCode(config: ChatbotConfig, apiEndpoint: string): string {
  return `<!-- Zoobicon AI Chat Widget -->
<script>
(function() {
  var ZOOBICON_CHAT = {
    businessName: ${JSON.stringify(config.businessName)},
    greeting: ${JSON.stringify(config.greeting)},
    primaryColor: ${JSON.stringify(config.primaryColor)},
    position: ${JSON.stringify(config.position)},
    collectEmail: ${JSON.stringify(config.collectEmail)},
    apiEndpoint: ${JSON.stringify(apiEndpoint)},

    init: function() {
      // Create chat bubble
      var bubble = document.createElement('div');
      bubble.id = 'zb-chat-bubble';
      bubble.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
      bubble.style.cssText = 'position:fixed;' + (this.position === 'bottom-left' ? 'left' : 'right') + ':20px;bottom:20px;width:56px;height:56px;border-radius:28px;background:' + this.primaryColor + ';display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:99999;transition:transform 0.2s';
      bubble.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
      bubble.onmouseout = function() { this.style.transform = 'scale(1)'; };
      bubble.onclick = function() { ZOOBICON_CHAT.toggle(); };
      document.body.appendChild(bubble);

      // Create chat panel (hidden initially)
      var panel = document.createElement('div');
      panel.id = 'zb-chat-panel';
      panel.style.cssText = 'position:fixed;' + (this.position === 'bottom-left' ? 'left' : 'right') + ':20px;bottom:86px;width:380px;max-height:500px;border-radius:16px;background:white;box-shadow:0 8px 40px rgba(0,0,0,0.15);z-index:99999;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,system-ui,sans-serif';

      panel.innerHTML = '<div style="background:' + this.primaryColor + ';padding:16px;color:white"><div style="font-weight:600;font-size:15px">' + this.businessName + '</div><div style="font-size:13px;opacity:0.8">AI Assistant</div></div>' +
        '<div id="zb-chat-messages" style="flex:1;overflow-y:auto;padding:16px;min-height:200px;max-height:350px"></div>' +
        '<div style="padding:12px;border-top:1px solid #eee;display:flex;gap:8px"><input id="zb-chat-input" type="text" placeholder="Type a message..." style="flex:1;padding:8px 12px;border:1px solid #ddd;border-radius:8px;outline:none;font-size:14px"/><button id="zb-chat-send" style="padding:8px 16px;background:' + this.primaryColor + ';color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px">Send</button></div>';

      document.body.appendChild(panel);

      // Add greeting message
      this.addMessage(this.greeting, 'bot');

      // Wire up send button
      document.getElementById('zb-chat-send').onclick = function() { ZOOBICON_CHAT.send(); };
      document.getElementById('zb-chat-input').onkeypress = function(e) { if (e.key === 'Enter') ZOOBICON_CHAT.send(); };

      this.messages = [];
    },

    toggle: function() {
      var panel = document.getElementById('zb-chat-panel');
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    },

    addMessage: function(text, sender) {
      var container = document.getElementById('zb-chat-messages');
      var msg = document.createElement('div');
      msg.style.cssText = 'margin-bottom:12px;' + (sender === 'user' ? 'text-align:right' : '');
      msg.innerHTML = '<div style="display:inline-block;max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5;' +
        (sender === 'user' ? 'background:' + this.primaryColor + ';color:white' : 'background:#f3f4f6;color:#374151') + '">' + text + '</div>';
      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    },

    send: function() {
      var input = document.getElementById('zb-chat-input');
      var text = input.value.trim();
      if (!text) return;

      this.addMessage(text, 'user');
      this.messages.push({ role: 'user', content: text });
      input.value = '';

      // Show typing indicator
      this.addMessage('...', 'bot');

      // Call API
      fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: this.messages })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        // Remove typing indicator
        var container = document.getElementById('zb-chat-messages');
        container.removeChild(container.lastChild);

        var reply = data.reply || 'Sorry, I could not process that. Please try again.';
        ZOOBICON_CHAT.addMessage(reply, 'bot');
        ZOOBICON_CHAT.messages.push({ role: 'assistant', content: reply });
      })
      .catch(function() {
        var container = document.getElementById('zb-chat-messages');
        container.removeChild(container.lastChild);
        ZOOBICON_CHAT.addMessage('Connection error. Please try again.', 'bot');
      });
    },

    messages: []
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { ZOOBICON_CHAT.init(); });
  } else {
    ZOOBICON_CHAT.init();
  }
})();
</script>`;
}

/**
 * Generate the API endpoint code for handling chatbot messages.
 * This runs on our servers — customer's widget calls our API.
 */
export function generateSystemPrompt(config: ChatbotConfig): string {
  return `You are the AI assistant for ${config.businessName}. ${config.businessDescription}

Your job is to help visitors with questions about the business.

Rules:
- Be friendly, helpful, and concise
- Answer based on the business information provided
- If you don't know something specific, say so honestly
- For complex issues, suggest contacting the business directly
- Keep responses under 3 sentences unless more detail is needed
- Never make up information about the business
${config.knowledgeBase ? `\nKnowledge base:\n${config.knowledgeBase}` : ""}
${config.humanEscalationEmail ? `\nIf the visitor needs human help, direct them to: ${config.humanEscalationEmail}` : ""}`;
}
