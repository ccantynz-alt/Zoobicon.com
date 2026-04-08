import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SNIPPET = `(function(){
  try {
    var script = document.currentScript || (function(){
      var s = document.getElementsByTagName('script');
      return s[s.length - 1];
    })();
    if (!script) return;
    var src = script.src || '';
    var botId = '';
    try {
      var url = new URL(src, window.location.href);
      botId = url.searchParams.get('bot') || '';
    } catch(e) {}
    if (!botId) { console.warn('[Zoobicon Chatbot] missing bot param'); return; }
    if (window.__zoobiconChatbotLoaded) return;
    window.__zoobiconChatbotLoaded = true;

    var origin = (function(){
      try { return new URL(src).origin; } catch(e){ return ''; }
    })();
    var widgetUrl = origin + '/api/chatbot/' + encodeURIComponent(botId) + '/widget';

    var reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e) {}

    var btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Open chat');
    btn.style.cssText = [
      'position:fixed','bottom:20px','right:20px','width:56px','height:56px',
      'border-radius:9999px','border:none','cursor:pointer',
      'background:linear-gradient(135deg,#8b5cf6,#6366f1)','color:#fff',
      'box-shadow:0 10px 30px rgba(99,102,241,0.4)','z-index:2147483647',
      'display:flex','align-items:center','justify-content:center','font-size:24px',
      'transition:' + (reduceMotion ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease')
    ].join(';');
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    if (!reduceMotion) {
      btn.onmouseenter = function(){ btn.style.transform = 'scale(1.08)'; };
      btn.onmouseleave = function(){ btn.style.transform = 'scale(1)'; };
    }

    var iframe = document.createElement('iframe');
    iframe.src = widgetUrl;
    iframe.title = 'Chat support';
    iframe.allow = 'clipboard-write';
    iframe.style.cssText = [
      'position:fixed','bottom:88px','right:20px','width:360px','height:520px',
      'max-width:calc(100vw - 40px)','max-height:calc(100vh - 120px)',
      'border:none','border-radius:16px','background:#fff',
      'box-shadow:0 20px 60px rgba(0,0,0,0.25)','z-index:2147483647',
      'display:none','opacity:0',
      'transition:' + (reduceMotion ? 'none' : 'opacity 0.2s ease')
    ].join(';');

    function isMobile(){ return window.innerWidth < 480; }
    function applyMobile(){
      if (isMobile()) {
        iframe.style.width = '100vw';
        iframe.style.height = '100vh';
        iframe.style.maxWidth = '100vw';
        iframe.style.maxHeight = '100vh';
        iframe.style.bottom = '0';
        iframe.style.right = '0';
        iframe.style.borderRadius = '0';
      }
    }
    window.addEventListener('resize', applyMobile);

    var open = false;
    function toggle(){
      open = !open;
      if (open) {
        applyMobile();
        iframe.style.display = 'block';
        requestAnimationFrame(function(){ iframe.style.opacity = '1'; });
        btn.setAttribute('aria-label','Close chat');
      } else {
        iframe.style.opacity = '0';
        setTimeout(function(){ if (!open) iframe.style.display = 'none'; }, reduceMotion ? 0 : 200);
        btn.setAttribute('aria-label','Open chat');
      }
    }
    btn.addEventListener('click', toggle);

    window.addEventListener('message', function(ev){
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === 'zoobicon-chatbot-close' && open) toggle();
    });

    document.body.appendChild(btn);
    document.body.appendChild(iframe);
  } catch(err) {
    console.error('[Zoobicon Chatbot] init failed', err);
  }
})();`;

export async function GET(): Promise<Response> {
  return new Response(SNIPPET, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function OPTIONS(): Promise<Response> {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    },
  );
}
