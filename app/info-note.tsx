import type {ReactNode} from 'react';

export default function InfoNote({label,children,heading}:{label:string;children:ReactNode;heading?:ReactNode}){
 const info=<details className="info-note"><summary aria-label={label} title={label}><span aria-hidden="true">!</span></summary><div className="info-note-content">{children}</div></details>;
 return heading?<div className="info-heading"><div>{heading}</div>{info}</div>:info;
}
