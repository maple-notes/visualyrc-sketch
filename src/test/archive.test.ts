import {describe,it,expect} from 'vitest';
import {zipSync,strToU8} from 'fflate';
import {createProject,postText,place,link,revise,uid,type Asset} from '../domain/model';
import {exportArchive,importArchive,readEntries} from '../storage/archive';
const zip=(files:Record<string,Uint8Array>)=>new Blob([Uint8Array.from(zipSync(files)).buffer]);
describe('portable archives',()=>{
 it('roundtrips content/relationships and media with fresh IDs',async()=>{let p=postText(postText(createProject(),'a'),'b');p=place(p,p.nodes[0].id,p.pages[0].id);p=link(p,p.nodes[0].id,p.nodes[1].id);const a:Asset={id:uid(),projectId:p.id,kind:'image',name:'image.png',mime:'image/png',blob:new Blob([new Uint8Array([1,2,3])])};p=revise(p,n=>{n.nodes.push({id:uid(),kind:'image',assetId:a.id,altText:'test',createdAt:n.createdAt,updatedAt:n.updatedAt});});const result=await importArchive(await exportArchive(p,[a]));expect(result.project.id).not.toBe(p.id);expect(result.project.nodes[0].id).not.toBe(p.nodes[0].id);expect(result.project.placements[0].nodeId).toBe(result.project.nodes[0].id);expect(result.project.edges).toHaveLength(1);expect(new Uint8Array(await result.assets[0].blob.arrayBuffer())).toEqual(new Uint8Array([1,2,3]));});
 it('rejects traversal, missing manifest and malformed data',async()=>{expect(()=>readEntries(zipSync({'../bad':strToU8('x')}))).toThrow();expect(()=>readEntries(new Uint8Array([1,2,3]))).toThrow();await expect(importArchive(zip({'manifest.json':strToU8('{}'),'project.json':strToU8('{}')}))).rejects.toThrow();});
 it('rejects missing referenced assets and unsupported versions',async()=>{const p=createProject();const manifest={format:'visualyrc-sketch',formatVersion:2,assets:[]};await expect(importArchive(zip({'manifest.json':strToU8(JSON.stringify(manifest)),'project.json':strToU8(JSON.stringify(p))}))).rejects.toThrow();});
 it('bounds actual inflated JSON size, not only compressed size',()=>{const bytes=zipSync({'manifest.json':strToU8('x'.repeat(9*1024*1024)),'project.json':strToU8('{}')},{level:9});expect(bytes.length).toBeLessThan(20000);expect(()=>readEntries(bytes)).toThrow(/limits/);});
});
