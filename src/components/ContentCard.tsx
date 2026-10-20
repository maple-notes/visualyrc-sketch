import {useEffect,useState} from 'react';
import {Type,Image as ImageIcon} from 'lucide-react';
import type {Content} from '../domain/model';
import {db} from '../storage/db';
export function MediaImage({assetId,alt}:{assetId:string;alt:string}){const [url,setUrl]=useState('');useEffect(()=>{let live=true,objectUrl='';db.assets.get(assetId).then(a=>{if(a&&live){objectUrl=URL.createObjectURL(a.blob);setUrl(objectUrl);}});return()=>{live=false;if(objectUrl)URL.revokeObjectURL(objectUrl);};},[assetId]);return url?<img draggable={false} src={url} alt={alt}/>:<span className="media-loading">Loading image…</span>;}
export function KindIcon({kind}:{kind:Content['kind']}){return kind==='text'?<Type size={15} aria-label="Text"/>:<ImageIcon size={15} aria-label="Image"/>;}
export default function ContentCard({content}:{content:Content}){return content.kind==='text'?<p className="content-text">{content.text}</p>:<MediaImage assetId={content.assetId} alt={content.altText}/>;}
