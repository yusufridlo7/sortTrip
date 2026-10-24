// Public policy pages need no account, provider calls or tracking scripts.
const requested=new URLSearchParams(location.search).get('lang');
let preferred=requested;
try{if(!['id','en'].includes(preferred))preferred=localStorage.getItem('sorttrip-language');if(['id','en'].includes(requested))localStorage.setItem('sorttrip-language',requested);}catch{}
preferred=preferred==='en'?'en':'id';
document.documentElement.lang=preferred;
document.querySelectorAll('[data-policy-lang]').forEach(el=>{el.hidden=el.dataset.policyLang!==preferred;});
const heading=document.querySelector(`[data-policy-lang="${preferred}"] h1`);
if(heading)document.title=heading.textContent+' | SortTrip';

document.querySelectorAll('[data-brand-tagline]').forEach(el=>{el.textContent=preferred==='en'?'Travel smarter, plan better':'Sortir tiket, susun itinerary';});
