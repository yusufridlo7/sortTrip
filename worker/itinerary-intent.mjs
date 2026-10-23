// Deliberately narrow edit intent: the current message, never chat history.
export function itineraryIntent(message='') {
 const text=String(message).toLowerCase();
 const hotel=/\b(hotel|penginapan|accommodation)\b/.test(text);
 const unchanged=/\b(jangan|tidak perlu|do not|don't)\s+(?:ganti|ubah|change|replace)\s+(?:hotel|penginapan|accommodation)/.test(text);
 const match=text.match(/(?:di\s*bawah|dibawah|kurang dari|maksimal|max(?:imum)?|under|below|less than)\s*(?:rp\.?\s*|idr\s*)?(\d[\d.,]*)(?:\s*(ribu|rb|k|juta|jt))?\s*(?:rupiah\s*)?(?:per\s*(?:malam|night)|\/\s*(?:malam|night)|semalam|a night)/);
 let maxNightIDR;
 if(hotel&&match){const n=Number(match[2]&&!/^\d{1,3}(?:[.,]\d{3})+$/.test(match[1])?match[1].replace(',','.'):match[1].replace(/[.,]/g,'')),scale=/^(ribu|rb|k)$/.test(match[2]||'')?1000:/^(juta|jt)$/.test(match[2]||'')?1000000:1;const amount=n*scale;if(Number.isSafeInteger(amount)&&amount>0&&amount<=1e9)maxNightIDR=amount;}
 const dayNames={pertama:1,kedua:2,ketiga:3,keempat:4,kelima:5,first:1,second:2,third:3};
 const attractionDays=[...text.matchAll(/(?:hari\s*(?:ke[- ]?)?(\d+|pertama|kedua|ketiga|keempat|kelima)|(?:day\s*(\d+))|\b(first|second|third) day)/g)].map(m=>Number(m[1]||m[2])||dayNames[m[1]||m[3]]).filter(n=>Number.isInteger(n)&&n>0&&n<=70);
 return {attractionDays,replaceHotels:hotel&&!unchanged&&(/\b(ganti|ubah|change|replace|switch|cari|find)\s+(?:pilihan\s+)?(?:hotel|penginapan|accommodation)\b|\b(?:hotel|penginapan|accommodation)\s+(?:nya\s+)?(?:ganti|ubah|change|replace|switch|cari|find)\b/.test(text)||maxNightIDR!==undefined),replaceAttractions:!/(?:jangan|do not|don't)\s+(?:ganti|ubah|change|replace)\s+(?:wisata|attractions?|museum)/.test(text)&&/\b(ganti|ubah|replace|change|switch)\s+(?:(?:semua|objek|tempat|the|all|to|ke|menjadi|with)\s+)*(wisata|attractions?|sightseeing|museum)\b/.test(text),...(maxNightIDR&&!unchanged?{maxNightIDR,exclusive:/di\s*bawah|dibawah|kurang dari|under|below|less than/.test(match[0])}:{})};
}
