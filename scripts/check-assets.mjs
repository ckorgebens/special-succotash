import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projects,explorations,gallery} from '../dist/data.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const assets=new Set();
function check(value,base=root){
  if(!value||/^(?:https?:|data:|mailto:|#)/i.test(value))return;
  if(value.startsWith('/'))throw Error(`Resource must support project subpaths: ${value}`);
  const file=path.resolve(base,value);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw Error(`Missing local resource: ${value}`);
  assets.add(file);
}
for(const item of [...projects,...explorations,...gallery]){
  for(const key of ['cover','hero','video'])check(item[key]);
  for(const image of item.images||[])if(typeof image==='string')check(image);else{check(image.src);check(image.poster);}
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g))check(match[1]);
for(const match of fs.readFileSync(path.join(root,'style.css'),'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g))check(match[1]);
for(const name of ['assets/about/model.glb','assets/about/matcap.jpg'])check('./'+name);
console.log(`Checked ${assets.size} local assets and portable resource paths.`);
