import {useId,useState,type ReactNode} from 'react';
import {ChevronDown} from 'lucide-react';
import {tr} from './i18n';
import {useNarrative} from './i18n/narratives';

// Native disclosure keeps its children mounted: hiding it does not reset forms,
// abandon in-flight work, change the itinerary or trigger a booking action.
export default function ExpandableDetails({children,name,kind='item'}:{children:ReactNode;name:string;kind?:'item'|'conversation'}){
 const [open,setOpen]=useState(false);
 const narrative=useNarrative();
 const contentId=useId();
 const label=tr(kind==='conversation'?(open?'conversation_hide':'conversation_show'):(open?'item_details_hide':'item_details_show'));
 return <details className={'expandable-details expandable-'+kind} onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary aria-expanded={open} aria-controls={contentId} aria-label={tr('disclosure_label',{action:label,name:narrative(name)})}>
   <span>{label}</span><ChevronDown size={16} aria-hidden="true"/>
  </summary>
  <div id={contentId} className="expandable-details-content">{children}</div>
 </details>;
}
