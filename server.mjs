import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.woff':'font/woff','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let name;
  try {name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);} catch {res.writeHead(400);res.end();return;}
  let file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);res.end();return;}
  if(name==='/'||!path.extname(name))file=path.join(root,'index.html');
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if(range){
      const start=range[1]?Number(range[1]):Math.max(0,stat.size-Number(range[2]));
      const end=range[1]&&range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
      if(start>end||start>=stat.size){res.writeHead(416,{...headers,'Content-Range':`bytes */${stat.size}`});res.end();return;}
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
      fs.createReadStream(file,{start,end}).pipe(res);return;
    }
    res.writeHead(200,{...headers,'Content-Length':stat.size});
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
