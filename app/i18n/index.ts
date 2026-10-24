import i18next from 'i18next';
import {initReactI18next,useTranslation} from 'react-i18next';
import baseId from './locales/id.json';
import baseEn from './locales/en.json';
import support from './locales/support.json';
const id={...baseId,...support.id},en={...baseEn,...support.en};
export type Language='id'|'en';
export const languageKey='sorttrip-language';
export function normalizeLanguage(value:unknown):Language{return typeof value==='string'&&/^en(?:-|$)/i.test(value)?'en':'id';}
export function detectLanguage(stored:unknown,browser:unknown):Language{return stored==='id'||stored==='en'?stored:normalizeLanguage(browser);}
let initial:Language='id';
try{initial=detectLanguage(globalThis.localStorage?.getItem(languageKey),globalThis.navigator?.language);}catch{initial=normalizeLanguage(globalThis.navigator?.language);}
void i18next.use(initReactI18next).init({resources:{id:{translation:id},en:{translation:en}},lng:initial,supportedLngs:['id','en'],fallbackLng:'id',initAsync:false,returnNull:false,interpolation:{escapeValue:false}});
export const language=():Language=>normalizeLanguage(i18next.resolvedLanguage||i18next.language);
export const locale=()=>language()==='en'?'en-GB':'id-ID';
export const tr=(key:string,values:Record<string,unknown>={})=>String(i18next.t(key,values));
export function formatMoney(amount:number,currency='IDR'){return new Intl.NumberFormat(locale(),{style:'currency',currency,maximumFractionDigits:currency==='IDR'?0:2}).format(amount);}
export function formatDate(value:string|number|Date,options:Intl.DateTimeFormatOptions={}){return new Intl.DateTimeFormat(locale(),options).format(new Date(value));}
export function countryLabel(code:string|undefined,fallback:string){try{return code&&/^[A-Z]{2}$/.test(code)?new Intl.DisplayNames([locale()],{type:'region'}).of(code)||label(fallback):label(fallback);}catch{return label(fallback);}}
// Translate known catalogue text only; user prose and supplier names remain unchanged.
const reverse=new Map<string,string>();
for(const [key,value] of Object.entries(id))if(!value.includes('{{'))reverse.set(value,key);
for(const [key,value] of Object.entries(en))if(!value.includes('{{'))reverse.set(value,key);
const escapePattern=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=[...Object.entries(id),...Object.entries(en)].filter(([,value])=>value.includes('{{v')).map(([key,value])=>{const names=[...value.matchAll(/\{\{(v\d+)\}\}/g)].map(m=>m[1]);return {key,names,pattern:new RegExp('^'+value.split(/\{\{v\d+\}\}/g).map(escapePattern).join('(.+?)')+'$')};});
export function label(value:unknown):string{const text=typeof value==='string'?value:'';const people=text.match(/^(\d+) orang$/);if(people)return tr('people',{count:Number(people[1])});const flight=text.match(/^([A-Z]{3} → [A-Z]{3} · )(pulang-pergi|sekali jalan)$/);if(flight)return flight[1]+tr(flight[2]==='pulang-pergi'?'roundtrip_label':'oneway_label');const key=reverse.get(text.trim());if(key)return text.replace(text.trim(),tr(key));for(const entry of patterns){const match=text.match(entry.pattern);if(match){const values=Object.fromEntries(entry.names.map((name,i)=>[name,match[i+1]]));return tr(entry.key,values);}}return text;}
export function useLanguage(){useTranslation();return language();}
function metadata(){if(typeof document==='undefined')return;document.documentElement.lang=language();document.title=tr('meta_title');document.querySelector('meta[name="description"]')?.setAttribute('content',tr('meta_description'));for(const selector of ['meta[property="og:title"]','meta[name="twitter:title"]'])document.querySelector(selector)?.setAttribute('content',tr('meta_title'));for(const selector of ['meta[property="og:description"]','meta[name="twitter:description"]'])document.querySelector(selector)?.setAttribute('content',tr('meta_description'));const image='https://sorttrip.yusufridlo7.workers.dev/branding/social-'+language()+'.png?v=3';for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])document.querySelector(selector)?.setAttribute('content',image);document.querySelector('meta[property="og:image:alt"]')?.setAttribute('content','SortTrip — '+tr('brand_tagline'));}
i18next.on('languageChanged',()=>{try{globalThis.localStorage?.setItem(languageKey,language());}catch{}metadata();});
metadata();
export default i18next;
