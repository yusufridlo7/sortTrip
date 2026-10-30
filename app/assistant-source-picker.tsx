import {tr} from './i18n';
import {useId} from 'react';
import InfoNote from './info-note';
import type {Candidate} from '../lib/video-itinerary.mjs';
import type {Trip} from './travel-data';
export type MediaInputOptions={instructions:string;initialTrip?:Trip;onPlan:(candidates:Candidate[])=>Promise<void>;onUseReference?:(url:string)=>void};
export type AssistantSource='text'|'url'|'upload'|'transcript';
export type MediaSource=Exclude<AssistantSource,'text'>;
export default function AssistantSourcePicker({value,onChange,disabled=false}:{value:AssistantSource;onChange:(value:AssistantSource)=>void;disabled?:boolean}){
 const id=useId();
 return <div className="assistant-source-picker"><InfoNote label={tr('assistant_attachment_help_title')} heading={<label htmlFor={id}>{tr('assistant_attachment')}</label>}><p>{tr('assistant_attachment_help')}</p><p>{tr('assistant_attachment_help_example')}</p><p>{tr('assistant_attachment_help_access')}</p></InfoNote><select id={id} value={value} disabled={disabled} onChange={e=>onChange(e.target.value as AssistantSource)}>{(['text','url','upload','transcript'] as const).map(source=><option value={source} key={source}>{tr('assistant_attachment_'+source)}</option>)}</select><button type="button" className="secondary assistant-upload-shortcut" disabled={disabled} aria-pressed={value==='upload'} onClick={()=>onChange(value==='upload'?'text':'upload')}>{tr('unified_upload_action')} <small>MP4 / MOV / M4V</small></button></div>;
}
