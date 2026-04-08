import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WIDGET_JS = `(function(){
  if (window.__zbcChatLoaded) return;
  window.__zbcChatLoaded = true;
  var ORIGIN = document.currentScript && document.currentScript.src
    ? new URL(document.currentScript.src).origin
    : window.location.origin;
  var SITE_ID = (document.currentScript && document.currentScript.getAttribute('data-site-id')) || 'default';
  var VID_KEY = 'zbc_vid';
  var CID_KEY = 'zbc_cid_' + SITE_ID;
  function uid(){return 'v_'+Math.random().toString(36).slice(2)+Date.now().toString(36);}
  var visitorId = localStorage.getItem(VID_KEY) || uid();
  localStorage.setItem(VID_KEY, visitorId);
  var conversationId = Number(localStorage.getItem(CID_KEY) || 0) || null;
  var lastId = 0;
  var open = false;
  var css = '#zbc-bubble{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;z-index:2147483646;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px;border:none;transition:transform .2s}#zbc-bubble:hover{transform:scale(1.08)}#zbc-panel{position:fixed;bottom:90px;right:20px;width:340px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.3);z-index:2147483647;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,system-ui,sans-serif}#zbc-panel.open{display:flex}#zbc-head{padding:14px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center}#zbc-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0;line-height:1}#zbc-msgs{flex:1;overflow-y:auto;padding:12px;background:#f9fafb;display:flex;flex-direction:column;gap:8px}.zbc-m{max-width:80%;padding:8px 12px;border-radius:14px;font-size:14px;line-height:1.4;word-wrap:break-word}.zbc-m.visitor{background:#6366f1;color:#fff;align-self:flex-end;border-bottom-right-radius:4px}.zbc-m.ai,.zbc-m.agent{background:#fff;color:#111;align-self:flex-start;border:1px solid #e5e7eb;border-bottom-left-radius:4px}#zbc-form{display:flex;border-top:1px solid #e5e7eb;padding:10px;gap:8px;background:#fff}#zbc-input{flex:1;border:1px solid #e5e7eb;border-radius:20px;padding:8px 14px;font-size:14px;outline:none;font-family:inherit}#zbc-input:focus{border-color:#6366f1}#zbc-send{background:#6366f1;color:#fff;border:none;border-radius:20px;padding:0 16px;cursor:pointer;font-weight:600;font-size:14px}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  var bubble = document.createElement('button');
  bubble.id = 'zbc-bubble';
  bubble.setAttribute('aria-label','Open chat');
  bubble.innerHTML = '\u{1F4AC}';
  document.body.appendChild(bubble);
  var panel = document.createElement('div');
  panel.id = 'zbc-panel';
  panel.innerHTML = '<div id="zbc-head"><span>Chat with us</span><button id="zbc-close" aria-label="Close">\u00D7</button></div><div id="zbc-msgs"></div><form id="zbc-form"><input id="zbc-input" type="text" placeholder="Type a message..." autocomplete="off"/><button id="zbc-send" type="submit">Send</button></form>';
  document.body.appendChild(panel);
  var msgsEl = panel.querySelector('#zbc-msgs');
  var form = panel.querySelector('#zbc-form');
  var input = panel.querySelector('#zbc-input');
  function render(m){
    var d = document.createElement('div');
    d.className = 'zbc-m ' + (m.sender || 'visitor');
    d.textContent = m.body;
    msgsEl.appendChild(d);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    if (m.id > lastId) lastId = m.id;
  }
  function poll(){
    if (!conversationId) return;
    fetch(ORIGIN + '/api/livechat/poll?conversationId=' + conversationId + '&sinceId=' + lastId + '&wait=20000')
      .then(function(r){return r.json();})
      .then(function(d){
        if (d && d.messages) d.messages.forEach(render);
      })
      .catch(function(){})
      .finally(function(){ setTimeout(poll, 500); });
  }
  function send(text){
    return fetch(ORIGIN + '/api/livechat/send', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        conversationId: conversationId,
        sender: 'visitor',
        body: text,
        siteId: SITE_ID,
        visitorId: visitorId
      })
    }).then(function(r){return r.json();}).then(function(d){
      if (d && d.conversationId && !conversationId){
        conversationId = d.conversationId;
        localStorage.setItem(CID_KEY, String(conversationId));
        poll();
      }
      if (d && d.message) render(d.message);
    });
  }
  bubble.addEventListener('click', function(){
    open = !open;
    panel.classList.toggle('open', open);
    if (open && conversationId && lastId === 0) poll();
  });
  panel.querySelector('#zbc-close').addEventListener('click', function(){
    open = false; panel.classList.remove('open');
  });
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    send(text);
  });
  if (conversationId) poll();
})();`;

export async function GET(_req: NextRequest): Promise<NextResponse> {
  return new NextResponse(WIDGET_JS, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
