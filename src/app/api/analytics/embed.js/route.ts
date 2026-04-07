import { NextRequest } from "next/server";

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const endpoint = `${url.protocol}//${url.host}/api/analytics/track`;
  const js = `(function(){var s=document.currentScript;if(!s)return;var id=s.getAttribute('data-site-id');if(!id)return;var ep=${JSON.stringify(endpoint)};function send(t){try{fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteId:id,eventType:t||'pageview',path:location.pathname+location.search,referrer:document.referrer||undefined}),keepalive:true}).catch(function(){})}catch(e){}}send();var p=history.pushState;history.pushState=function(){p.apply(this,arguments);send()};var r=history.replaceState;history.replaceState=function(){r.apply(this,arguments);send()};window.addEventListener('popstate',function(){send()});window.zoobicon=window.zoobicon||{};window.zoobicon.track=function(n){send(n||'custom')};})();`;
  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
