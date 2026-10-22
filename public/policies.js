// Public policy pages need no account, provider calls or tracking scripts.
const preferred=new URLSearchParams(location.search).get('lang');
if(preferred==='en'){
 document.documentElement.lang='en';
 document.querySelectorAll('[data-policy-lang]').forEach(el=>{el.hidden=el.dataset.policyLang!=='en';});
 document.title=document.querySelector('[data-policy-lang="en"] h1')?.textContent+' | SortTrip';
}
