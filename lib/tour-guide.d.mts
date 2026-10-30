export type Guide={name:string;city:string;country:string;sources:string[];curated:boolean;image?:string;text:Record<string,string>};
export type Answer={question:string;answer:string;topic:string;destination:string;mode:string;sources:string[]};
export function destinationGuide(item:{place?:string;title:string},city?:string,country?:string,lang?:string):Guide;
export function guideAnswer(question:string,context:{guide:Guide;lang?:string;history?:Answer[]}):Answer;
export function guideMap(item:{place?:string;title:string},city?:string,country?:string,directions?:boolean):string;
export function createNarrator(speech:SpeechSynthesis|undefined,Utterance:typeof SpeechSynthesisUtterance|undefined,onState?:(state:string)=>void):{supported:boolean;play:(text:string,lang:string)=>void;pause:()=>void;resume:()=>void;stop:()=>void};
