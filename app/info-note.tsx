import type {ReactNode} from 'react';
import {Dialog} from 'radix-ui';
import {label as localize,tr} from './i18n';

export default function InfoNote({label,children,heading}:{label:string;children:ReactNode;heading?:ReactNode}){
 const info=<span className="info-note"><Dialog.Root><Dialog.Trigger asChild><button type="button" className="info-note-trigger" aria-label={localize(label)} title={localize(label)}><span aria-hidden="true">!</span></button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="info-panel-overlay"/><Dialog.Content className="info-panel" aria-describedby={undefined}><Dialog.Title className="info-panel-title">{localize(label)}</Dialog.Title><div className="info-panel-body">{children}</div><Dialog.Close type="button" className="info-panel-close" aria-label={tr('close')} title={tr('close')}><span aria-hidden="true">×</span></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root></span>;
 return heading?<div className="info-heading"><div>{heading}</div>{info}</div>:info;
}
