// Public reference tariffs personally checked against these official pages.
// They are not live availability or a promise about the travel date. A failed
// refresh never advances checkedAt; the reference expires after 30 days.
const records=[
 {names:['national museum','national museum muzium negara','muzium negara','national museum of malaysia'],amount:5,currency:'MYR',audience:'Foreign adult',quote:'FOREIGNER Adult RM 5.00',sourceUrl:'https://www.muziumnegara.gov.my/en/ticket',checkedAt:'2026-10-24T10:57:20Z'},
 {names:['islamic arts museum malaysia','islamic arts museum'],amount:20,currency:'MYR',audience:'Adult (including non-Malaysian visitors)',quote:'Adults RM20',sourceUrl:'https://iamm.org.my/visit-us',checkedAt:'2026-10-24T10:57:20Z'}
];
export function referenceAdmission(name,city,now=Date.now()){
 if(!/^kuala lumpur$/i.test(city||''))return undefined;
 const normalized=String(name||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const record=records.find(item=>item.names.includes(normalized));
 if(!record||now<Date.parse(record.checkedAt)||now-Date.parse(record.checkedAt)>30*86400000)return undefined;
 const {names,...reference}=record;return reference;
}
