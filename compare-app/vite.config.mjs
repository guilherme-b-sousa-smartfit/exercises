import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync,existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {resolve} from 'node:path';

export default defineConfig(({mode})=>({
 base:'./',
 plugins:[react(),{
  name:'local-review-api',
  async configureServer(server){
   const env=loadEnv(mode,process.cwd(),'');
   for(const key of ['GOOGLE_SERVICE_ACCOUNT_JSON','REVIEW_PASSWORD'])if(!process.env[key]&&env[key])process.env[key]=env[key];
   // Local credentials stay in Node; none of these values enter the browser bundle.
   if(!process.env.GOOGLE_SERVICE_ACCOUNT_JSON){const path=resolve(homedir(),'.config/claude-sheets-sa.json');if(existsSync(path))process.env.GOOGLE_SERVICE_ACCOUNT_JSON=readFileSync(path,'utf8');}
   const local=resolve(process.cwd(),'.env.review.local');
   if(!process.env.REVIEW_PASSWORD&&existsSync(local)){const line=readFileSync(local,'utf8').split('\n').find(s=>s.startsWith('REVIEW_PASSWORD='));if(line)process.env.REVIEW_PASSWORD=line.slice(16);}
   const {default:reviews}=await import('./api/reviews.mjs');
   const {default:session}=await import('./api/session.mjs');
   const {default:gymvisualPreview}=await import('./api/gymvisual-preview.mjs');
   server.middlewares.use((req,res,next)=>{
    const path=(req.url||'').split('?')[0];
    if(path==='/api/reviews')return void reviews(req,res);
    if(path==='/api/gymvisual-preview')return void gymvisualPreview(req,res);
    if(path==='/api/session')return void session(req,res);
    next();
   });
  },
 }],
 server:{port:5173,open:true},
}));
