import type {ReactNode} from 'react';
import {label as localize} from './i18n';

export default function InfoNote({label,children,heading}:{label:string;children:ReactNode;heading?:ReactNode}){
 const info=<details className="info-note"><summary aria-label={localize(label)} title={localize(label)}><span aria-hidden="true">!</span></summary><div className="info-note-content">{children}</div></details>;
 return heading?<div className="info-heading"><div>{heading}</div>{info}</div>:info;
}
