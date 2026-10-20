import 'fake-indexeddb/auto';
import {it,expect,afterEach} from 'vitest';
import {db,saveProject,projectAssets} from '../storage/db';
import {createProject,postText,uid,revise} from '../domain/model';
afterEach(async()=>{await db.projects.clear();await db.assets.clear();});
it('saves project and original media atomically and reloads shared IDs',async()=>{let p=postText(createProject(),'persistent');const a={id:uid(),projectId:p.id,kind:'image' as const,name:'fixture.png',mime:'image/png',blob:new Blob(['test'])};p=revise(p,n=>{n.nodes.push({id:uid(),kind:'image',assetId:a.id,altText:'fixture',createdAt:n.createdAt,updatedAt:n.updatedAt});});await saveProject(p,[a]);expect((await db.projects.get(p.id))?.nodes).toEqual(p.nodes);expect((await projectAssets(p))[0].blob.size).toBe(4);});
