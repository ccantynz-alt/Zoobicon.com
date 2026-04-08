export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c] ?? c;
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ botId: string }> },
): Promise<Response> {
  const { botId } = await params;
  const safeBotId = escapeHtml(botId).slice(0, 64);
  const botName = "Support";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1" />
<title>${escapeHtml(botName)} Chat</title>
<style>
  *,*::before,*::after { box-sizing: border-box; }
  html, body { margin:0; padding:0; height:100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background:#fff; color:#0f172a; }
  .wrap { display:flex; flex-direction:column; height:100vh; }
  .hdr { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:linear-gradient(135deg,#8b5cf6,#6366f1); color:#fff; }
  .hdr h1 { margin:0; font-size:15px; font-weight:600; letter-spacing:-0.01em; }
  .hdr .sub { font-size:11px; opacity:0.85; }
  .x { background:rgba(255,255,255,0.18); border:none; color:#fff; width:28px; height:28px; border-radius:9999px; cursor:pointer; font-size:16px; line-height:1; }
  .x:hover { background:rgba(255,255,255,0.3); }
  .msgs { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; background:#f8fafc; }
  .msg { max-width:80%; padding:10px 14px; border-radius:14px; font-size:14px; line-height:1.45; word-wrap:break-word; white-space:pre-wrap; }
  .msg.user { align-self:flex-end; background:#6366f1; color:#fff; border-bottom-right-radius:4px; }
  .msg.bot { align-self:flex-start; background:#fff; color:#0f172a; border:1px solid #e2e8f0; border-bottom-left-radius:4px; }
  .msg.err { align-self:center; background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; font-size:12px; }
  .typing { align-self:flex-start; color:#64748b; font-size:12px; padding:6px 10px; }
  form { display:flex; gap:8px; padding:12px; border-top:1px solid #e2e8f0; background:#fff; }
  input { flex:1; padding:10px 14px; border:1px solid #e2e8f0; border-radius:9999px; font-size:14px; outline:none; }
  input:focus { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,0.15); }
  button.send { background:linear-gradient(135deg,#8b5cf6,#6366f1); color:#fff; border:none; border-radius:9999px; padding:0 18px; font-size:14px; font-weight:600; cursor:pointer; }
  button.send:disabled { opacity:0.5; cursor:not-allowed; }
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <div>
      <h1>${escapeHtml(botName)}</h1>
      <div class="sub">Powered by Zoobicon</div>
    </div>
    <button class="x" id="closeBtn" aria-label="Close">&times;</button>
  </div>
  <div class="msgs" id="msgs">
    <div class="msg bot">Hi! How can I help you today?</div>
  </div>
  <form id="form">
    <input id="input" type="text" placeholder="Type a message..." autocomplete="off" maxlength="2000" />
    <button class="send" id="sendBtn" type="submit">Send</button>
  </form>
</div>
<script>
(function(){
  var BOT_ID = ${JSON.stringify(safeBotId)};
  var msgs = document.getElementById('msgs');
  var form = document.getElementById('form');
  var input = document.getElementById('input');
  var sendBtn = document.getElementById('sendBtn');
  var closeBtn = document.getElementById('closeBtn');
  var history = [];

  closeBtn.addEventListener('click', function(){
    try { parent.postMessage({ type: 'zoobicon-chatbot-close' }, '*'); } catch(e) {}
  });

  function add(role, text) {
    var d = document.createElement('div');
    d.className = 'msg ' + role;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.disabled = true;
    add('user', text);
    history.push({ role: 'user', content: text });
    var typing = document.createElement('div');
    typing.className = 'typing';
    typing.textContent = 'Typing...';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    try {
      var res = await fetch('/api/chatbot/' + encodeURIComponent(BOT_ID) + '/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(0, -1) })
      });
      var data = await res.json();
      typing.remove();
      if (!res.ok || !data.ok) {
        add('err', data.error || 'Sorry, something went wrong. Please try again.');
      } else {
        add('bot', data.reply);
        history.push({ role: 'assistant', content: data.reply });
      }
    } catch (err) {
      typing.remove();
      add('err', 'Network error. Please try again.');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      "Content-Security-Policy": "frame-ancestors *",
      "X-Frame-Options": "ALLOWALL",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
