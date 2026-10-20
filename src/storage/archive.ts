import {Unzip,UnzipInflate,zipSync,strToU8,strFromU8} from 'fflate';
import {z} from 'zod';
import {uid,validateProject,type Asset,type Project} from '../domain/model';
const MB=1024*1024;
const descriptor=z.object({id:z.string().uuid(),kind:z.enum(['image','audio']),name:z.string().max(200),mime:z.string().max(100),size:z.number().int().nonnegative(),width:z.number().positive().optional(),height:z.number().positive().optional(),duration:z.number().positive().optional()}).strict();
const manifestSchema=z.object({format:z.literal('visualyrc-sketch'),formatVersion:z.literal(1),assets:z.array(descriptor).max(1000)}).strict();
export async function exportArchive(project:Project,assets:Asset[]):Promise<Blob>{
 validateProject(project);const files:Record<string,Uint8Array>={'project.json':strToU8(JSON.stringify(project))};
 const manifest={format:'visualyrc-sketch',formatVersion:1,assets:assets.map(a=>({id:a.id,kind:a.kind,name:a.name,mime:a.mime,size:a.blob.size,...(a.width?{width:a.width,height:a.height}:{}),...(a.duration?{duration:a.duration}:{})}))};
 files['manifest.json']=strToU8(JSON.stringify(manifest));let size=files['project.json'].length+files['manifest.json'].length;
 for(const a of assets){size+=a.blob.size;if(size>140*MB)throw Error('Project is too large to export (140 MiB limit).');files['assets/'+a.id]=new Uint8Array(await a.blob.arrayBuffer());}
 const bytes=zipSync(files,{level:0});return new Blob([Uint8Array.from(bytes).buffer],{type:'application/zip'});
}
export function readEntries(bytes:Uint8Array):Record<string,Uint8Array>{
 if(bytes.length>150*MB)throw Error('Archive exceeds 150 MiB');
 if(bytes[0]!==0x50||bytes[1]!==0x4b)throw Error('Not a project ZIP archive');
 const files:Record<string,Uint8Array>={};let count=0,total=0,failed:Error|undefined;
 const unzip=new Unzip(file=>{
  if(failed)return;count++;
  if(count>1000||!(/^(manifest\.json|project\.json|assets\/[0-9a-f-]{36})$/.test(file.name))||Object.hasOwn(files,file.name)){failed=Error('Invalid archive entry');return;}
  const cap=file.name.endsWith('.json')?8*MB:50*MB;let size=0;const chunks:Uint8Array[]=[];files[file.name]=new Uint8Array();
  file.ondata=(error,chunk,final)=>{if(failed)return;if(error){failed=error;return;}size+=chunk.length;total+=chunk.length;if(size>cap||total>200*MB){failed=Error('Expanded archive exceeds safe limits');file.terminate();return;}chunks.push(chunk);if(final){const value=new Uint8Array(size);let offset=0;for(const c of chunks){value.set(c,offset);offset+=c.length;}files[file.name]=value;}};
  try{file.start();}catch(e){failed=e instanceof Error?e:Error('Invalid compression');}
 });unzip.register(UnzipInflate);
 try{for(let at=0;at<bytes.length&&!failed;at+=65536)unzip.push(bytes.subarray(at,at+65536),at+65536>=bytes.length);}catch(e){throw new Error('Invalid or truncated archive: '+String(e),{cause:e});}
 if(failed)throw failed;if(!files['manifest.json']||!files['project.json'])throw Error('Missing project manifest');
 return files;
}
export async function importArchive(blob:Blob):Promise<{project:Project;assets:Asset[]}>{
 if(blob.size>150*MB)throw Error('Archive exceeds 150 MiB');const files=readEntries(new Uint8Array(await blob.arrayBuffer()));
 const manifest=manifestSchema.parse(JSON.parse(strFromU8(files['manifest.json'])));
 const p=validateProject(JSON.parse(strFromU8(files['project.json'])));
 const descriptors=new Map(manifest.assets.map(a=>[a.id,a]));if(descriptors.size!==manifest.assets.length)throw Error('Duplicate assets');
 if(Object.keys(files).length!==manifest.assets.length+2)throw Error('Unlisted archive content');
 const assets:Asset[]=manifest.assets.map(a=>{const b=files['assets/'+a.id];if(!b||b.length!==a.size)throw Error('Missing or damaged media');if(a.kind==='image'&&(!['image/png','image/jpeg','image/webp'].includes(a.mime)||a.size>10*MB))throw Error('Invalid image asset');if(a.kind==='audio'&&(!a.duration||a.size>50*MB))throw Error('Invalid audio asset');return {...a,projectId:p.id,blob:new Blob([Uint8Array.from(b).buffer],{type:a.mime})};});
 for(const n of p.nodes)if(n.kind==='image'&&descriptors.get(n.assetId)?.kind!=='image')throw Error('Missing image reference');
 if(p.activeAudioId&&descriptors.get(p.activeAudioId)?.kind!=='audio')throw Error('Missing audio reference');
 for(const page of p.pages)if(page.audioRange&&page.audioRange.end>(descriptors.get(page.audioRange.assetId)?.duration??0))throw Error('Range exceeds audio');
 // Imported IDs are always new, so restoring cannot overwrite existing work.
 const mapping=new Map<string,string>();const remap=(id:string)=>{let next=mapping.get(id);if(!next){next=uid();mapping.set(id,next);}return next;};
 const next:Project={...p,id:uid(),name:p.name+' (imported)',pages:p.pages.map(x=>({...x,id:remap(x.id),...(x.audioRange?{audioRange:{...x.audioRange,assetId:remap(x.audioRange.assetId)}}:{})})),nodes:p.nodes.map(x=>x.kind==='text'?{...x,id:remap(x.id)}:{...x,id:remap(x.id),assetId:remap(x.assetId)}),posts:p.posts.map(x=>({...x,id:remap(x.id),nodeId:remap(x.nodeId)})),placements:p.placements.map(x=>({...x,id:remap(x.id),nodeId:remap(x.nodeId),pageId:remap(x.pageId)})),edges:p.edges.map(x=>({...x,id:remap(x.id),source:remap(x.source),target:remap(x.target)})),graph:p.graph.map(x=>({...x,nodeId:remap(x.nodeId)})),viewports:p.viewports.map(x=>({...x,pageId:remap(x.pageId)})),...(p.activeAudioId?{activeAudioId:remap(p.activeAudioId)}:{})};
 return {project:validateProject(next),assets:assets.map(a=>({...a,id:remap(a.id),projectId:next.id}))};
}
