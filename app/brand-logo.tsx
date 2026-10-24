import {tr} from './i18n';
export function BrandIcon({className=''}:{className?:string}){return <img className={'sorttrip-brand-icon '+className} src="/branding/sorttrip-icon.svg?v=3" width="32" height="38" alt="" aria-hidden="true"/>;}
export default function BrandLogo({tagline=false}:{tagline?:boolean}){
 return <span className="sorttrip-logo" role="img" aria-label={tagline?'SortTrip · '+tr('brand_tagline'):'SortTrip'}><span className="brand-artwork"><img className="brand-on-light" src="/branding/sorttrip-logo-horizontal.svg?v=3" width="174" height="58" alt=""/><img className="brand-on-dark" src="/branding/sorttrip-logo-horizontal-dark.svg?v=3" width="174" height="58" alt=""/></span>{tagline&&<small className="brand-tagline">{tr('brand_tagline')}</small>}</span>;
}
