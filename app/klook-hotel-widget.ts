// Public owner-supplied affiliate embed. A data document has a unique opaque origin.
// Never move this script into the SortTrip document or a same-origin srcDoc.
export default `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<base href="https://affiliate.klook.com/"><title>Hotel Klook</title>
<style>body{margin:0;font-family:Arial,sans-serif}iframe{max-width:100%;border:0}*{box-sizing:border-box}</style></head><body>
<ins class="klk-aff-widget" data-adid="1489007" data-lang="id" data-currency="IDR" data-cardH="126" data-padding="92" data-lgH="470" data-edgeValue="655" data-dest_id="49" data-tid="" data-amount="2" data-prod="hotel_dynamic_widget"><a href="https://www.klook.com/" target="_blank" rel="noopener sponsored">Klook.com</a></ins>
<script>
const notify=(type,height)=>parent.postMessage({type,height},'*');
let ready=false;
function inspect(){
 const frame=document.querySelector('.klk-aff-widget iframe');
 const height=Math.ceil(Math.max(document.body.scrollHeight,frame?.offsetHeight||0));
 notify('sorttrip-klook-size',height);
}
// Klook's initializer emits loaded after its handshake; document load alone is not inventory success.
window.addEventListener('message',event=>{
 const frame=document.querySelector('.klk-aff-widget iframe');
 if(!frame||event.source!==frame.contentWindow||event.origin!=='https://affiliate.klook.com')return;
 if(event.data?.event==='loaded'){ready=true;notify('sorttrip-klook-ready');inspect()}
 if(event.data?.event==='alert')notify('sorttrip-klook-error');
});
new MutationObserver(inspect).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['src','style','height']});
new ResizeObserver(inspect).observe(document.body);
const script=document.createElement('script');script.async=true;
script.src='https://affiliate.klook.com/widget/fetch-iframe-init.js';
script.onerror=()=>notify('sorttrip-klook-error');document.body.appendChild(script);
setTimeout(()=>{if(!ready)notify('sorttrip-klook-error')},25000);
</script></body></html>`;
