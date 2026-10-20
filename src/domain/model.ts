import { z } from 'zod';
const id=z.string().uuid();
const point={x:z.number().finite(),y:z.number().finite()};
const time=z.string().datetime();
const text=z.object({id,kind:z.literal('text'),text:z.string().min(1).max(100000),createdAt:time,updatedAt:time}).strict();
const image=z.object({id,kind:z.literal('image'),assetId:id,altText:z.string().max(1000),createdAt:time,updatedAt:time}).strict();
export const contentSchema=z.discriminatedUnion('kind',[text,image]);
export const pageSchema=z.object({id,title:z.string().min(1).max(200),order:z.number().int().nonnegative(),audioRange:z.object({assetId:id,start:z.number().finite().nonnegative(),end:z.number().finite().positive()}).strict().optional()}).strict();
export const projectSchema=z.object({formatVersion:z.literal(1),id,name:z.string().min(1).max(200),createdAt:time,updatedAt:time,
 pages:z.array(pageSchema).min(1).max(1000),nodes:z.array(contentSchema).max(10000),posts:z.array(z.object({id,nodeId:id,postedAt:time}).strict()).max(10000),placements:z.array(z.object({id,pageId:id,nodeId:id,...point,width:z.number().finite().min(80).max(20000),height:z.number().finite().min(48).max(20000),zIndex:z.number().finite()}).strict()).max(20000),edges:z.array(z.object({id,source:id,target:id}).strict()).max(20000),graph:z.array(z.object({nodeId:id,...point}).strict()).max(10000),viewports:z.array(z.object({pageId:id,...point,zoom:z.number().min(.1).max(4)}).strict()).max(1000),activeAudioId:id.optional()}).strict();
export type Project=z.infer<typeof projectSchema>;
export type Content=z.infer<typeof contentSchema>;
export type Page=z.infer<typeof pageSchema>;
export type Placement=Project['placements'][number];
export type Asset={id:string;projectId:string;kind:'image'|'audio';name:string;mime:string;blob:Blob;width?:number;height?:number;duration?:number};
export const uid=()=>crypto.randomUUID();
export function createProject(name='Untitled project'):Project {const now=new Date().toISOString();return {formatVersion:1,id:uid(),name:name.trim()||'Untitled project',createdAt:now,updatedAt:now,pages:[{id:uid(),title:'Opening',order:0}],nodes:[],posts:[],placements:[],edges:[],graph:[],viewports:[]};}
export function validateProject(value:unknown):Project {
 const p=projectSchema.parse(value);
 const unique=(values:string[])=>{if(new Set(values).size!==values.length)throw Error('Duplicate record IDs');};
 unique(p.pages.map(x=>x.id));unique(p.nodes.map(x=>x.id));unique(p.posts.map(x=>x.id));unique(p.posts.map(x=>x.nodeId));unique(p.placements.map(x=>x.id));unique(p.edges.map(x=>x.id));unique(p.graph.map(x=>x.nodeId));unique(p.viewports.map(x=>x.pageId));
 const pages=new Set(p.pages.map(x=>x.id)),nodes=new Set(p.nodes.map(x=>x.id));
 if(p.posts.some(x=>!nodes.has(x.nodeId))||p.placements.some(x=>!nodes.has(x.nodeId)||!pages.has(x.pageId))||p.graph.some(x=>!nodes.has(x.nodeId))||p.viewports.some(x=>!pages.has(x.pageId)))throw Error('Broken content reference');
 const pairs:string[]=[];for(const e of p.edges){if(e.source===e.target||!nodes.has(e.source)||!nodes.has(e.target))throw Error('Invalid relationship');pairs.push([e.source,e.target].sort().join(':'));}unique(pairs);
 const ranges=p.pages.flatMap(x=>x.audioRange?[x.audioRange]:[]).sort((a,b)=>a.start-b.start);
 for(let i=0;i<ranges.length;i++){const r=ranges[i];if(r.assetId!==p.activeAudioId||r.start>=r.end||i>0&&r.start<ranges[i-1].end)throw Error('Invalid or overlapping audio ranges');}
 return p;
}
export function revise(p:Project,change:(next:Project)=>void):Project {const n=structuredClone(p);change(n);n.updatedAt=new Date().toISOString();return validateProject(n);}
export function postText(p:Project,text:string):Project {if(!text.trim())throw Error('Write something first');return revise(p,n=>{const now=new Date().toISOString(),id=uid();n.nodes.push({id,kind:'text',text:text.trim(),createdAt:now,updatedAt:now});n.posts.unshift({id:uid(),nodeId:id,postedAt:now});});}
export function place(p:Project,nodeId:string,pageId:string,x=120,y=120):Project{return revise(p,n=>{n.placements.push({id:uid(),nodeId,pageId,x,y,width:280,height:170,zIndex:n.placements.length});});}
export function link(p:Project,a:string,b:string):Project{return revise(p,n=>{n.edges.push({id:uid(),source:a,target:b});});}
export function removeContent(p:Project,id:string):Project{return revise(p,n=>{n.nodes=n.nodes.filter(x=>x.id!==id);n.posts=n.posts.filter(x=>x.nodeId!==id);n.placements=n.placements.filter(x=>x.nodeId!==id);n.edges=n.edges.filter(x=>x.source!==id&&x.target!==id);n.graph=n.graph.filter(x=>x.nodeId!==id);});}
export function removePage(p:Project,id:string):Project {if(p.pages.length===1)throw Error('Keep at least one page');return revise(p,n=>{n.pages=n.pages.filter(x=>x.id!==id);n.placements=n.placements.filter(x=>x.pageId!==id);n.viewports=n.viewports.filter(x=>x.pageId!==id);});}
