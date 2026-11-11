import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { createHash,randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as oidc from 'openid-client';
import type {Database} from './db.mts';
import {openDatabase} from './db.mts';
import type {IncomingMessage,ServerResponse} from 'node:http';
import { registerDomain } from './domain.mts';

export const digest=(s:string)=>createHash('sha256').update(s).digest('hex');
// Vercel imports this module directly. Keep initialization lazy so importing
// buildApp for local development and tests never opens a production database.
let productionApp:Promise<Awaited<ReturnType<typeof buildApp>>>|undefined;
async function startProductionApp(){
 for(const key of ['DATABASE_URL','PUBLIC_ORIGIN','OIDC_ISSUER','OIDC_CLIENT_ID','OIDC_CLIENT_SECRET']){
  if(!process.env[key])throw new Error(`Configuração de produção ausente: ${key}`);
 }
 const db=await openDatabase({url:process.env.DATABASE_URL,preview:false});
 try{
  const app=await buildApp({db,preview:false,origin:process.env.PUBLIC_ORIGIN,logger:true});
  app.addHook('onClose',async()=>{await db.close();});
  await app.ready();return app;
 }catch(error){await db.close();throw error;}
}
export default async function handler(request:IncomingMessage,response:ServerResponse){
 let app:Awaited<ReturnType<typeof buildApp>>;
 try{
  productionApp??=startProductionApp();
  app=await productionApp;
 }catch(error){
  productionApp=undefined;
  console.error('VOLTA: falha na inicialização de produção.',error);
  response.statusCode=503;
  response.setHeader('Content-Type','application/json; charset=utf-8');
  response.setHeader('Cache-Control','no-store');
  response.end(JSON.stringify({error:'Central temporariamente indisponível. Contate o administrador.'}));
  return;
 }
 app.server.emit('request',request,response);
}
const random=()=>randomBytes(32).toString('base64url');
const fail=(statusCode:number,message:string)=>{throw Object.assign(new Error(message),{statusCode});};
export async function buildApp(options:{db:Database;preview:boolean;origin?:string;logger?:boolean;rateMax?:number;oidcConfig?:oidc.Configuration}){
 const {db,preview}=options,origin=options.origin||'http://127.0.0.1:4175';
 if(!preview&&(!origin.startsWith('https://')||db.kind!=='postgres'))throw new Error('Produção exige HTTPS e PostgreSQL compartilhado.');
 let identity=options.oidcConfig;
 if(!preview&&!identity){
  const {OIDC_ISSUER,OIDC_CLIENT_ID,OIDC_CLIENT_SECRET}=process.env;
  if(!OIDC_ISSUER||!OIDC_CLIENT_ID||!OIDC_CLIENT_SECRET)throw new Error('Configure OIDC_ISSUER, OIDC_CLIENT_ID e OIDC_CLIENT_SECRET antes de produção.');
  identity=await oidc.discovery(new URL(OIDC_ISSUER),OIDC_CLIENT_ID,OIDC_CLIENT_SECRET);
 }
 const app=Fastify({logger:options.logger?{redact:['req.headers.cookie','req.headers.authorization','req.headers.x-csrf-token'],serializers:{req:(req:any)=>({method:req.method,url:req.url.split('?')[0],requestId:req.id})}}:false,bodyLimit:1100000,trustProxy:false});
 app.decorate('preview',preview);app.decorateRequest('user',null);app.decorateRequest('sessionId',null);app.decorateRequest('csrfToken',null);
 await app.register(cookie);await app.register(rateLimit,{max:options.rateMax||300,timeWindow:'1 minute'});
 app.setErrorHandler((error:any,req,reply)=>{
  const status=Number(error.statusCode)||500;
  if(status>=500)req.log.error({err:error,requestId:req.id},'Falha ao processar operação');
  const knownDb=['23514','23503','23505','22007','22008','22P02'].includes(String(error.code));
  reply.code(knownDb?400:status).send({error:knownDb?'Dados inválidos ou referência já existente. Revise os campos.':status>=500?'Não foi possível concluir. Seu conteúdo pode ser reenviado.':error.message,code:status===409?'CONFLICT':undefined});
 });
 app.addHook('onRequest',async(req,reply)=>{
  reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','same-origin').header('X-Frame-Options','DENY');
  reply.header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if(req.url.startsWith('/api/')||req.url.startsWith('/auth/'))reply.header('Cache-Control','no-store');
  if(req.cookies.volta_session){
   const hash=digest(req.cookies.volta_session);
   const row=(await db.query('SELECT m.*,s.csrf_token FROM sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=$1 AND s.expires_at>now() AND m.active=true',[hash])).rows[0];
   if(row){req.user={...row};delete req.user.csrf_token;delete req.user.oidc_sub;req.sessionId=hash;req.csrfToken=row.csrf_token;}
  }
  const path=req.url.split('?')[0];
  if(!path.startsWith('/api/')||path==='/api/session')return;
  if(req.method!=='GET'&&req.method!=='HEAD'){
   if(req.headers.origin&&req.headers.origin!==origin)fail(403,'Origem não autorizada.');
   if(req.headers['sec-fetch-site']==='cross-site')fail(403,'Origem não autorizada.');
  }
  if(path==='/api/session/preview')return;
  if(!req.user)fail(401,'Entre para acessar a central.');
  if(!['GET','HEAD'].includes(req.method)&&req.headers['x-csrf-token']!==req.csrfToken)fail(403,'Sua sessão precisa ser atualizada. Recarregue e tente novamente.');
 });
 async function session(reply:any,memberId:string,previous?:string|null){
  const token=random(),csrf=random();
  await db.transaction(async tx=>{
   if(previous)await tx.query('DELETE FROM sessions WHERE token_hash=$1',[previous]);
   await tx.query("INSERT INTO sessions(token_hash,member_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')",[digest(token),memberId,csrf]);
  });
  reply.setCookie('volta_session',token,{path:'/',httpOnly:true,secure:!preview,sameSite:'lax',maxAge:28800});
 }
 app.get('/api/session',async(req)=>({mode:preview?'preview':'oidc',me:req.user,csrfToken:req.csrfToken,members:preview||req.user?(await db.query('SELECT id,name,interests,preferences,role,active FROM members WHERE active=true ORDER BY name')).rows:[]}));
 app.post('/api/session/preview',{config:{rateLimit:{max:30,timeWindow:'1 minute'}}},async(req,reply)=>{
  if(!preview||!['127.0.0.1','::1'].includes(req.ip))fail(404,'Rota não encontrada.');
  const id=(req.body as any)?.memberId;
  if(typeof id!=='string'||!(await db.query('SELECT id FROM members WHERE id=$1 AND active=true',[id])).rows.length)fail(400,'Escolha um integrante válido.');
  await session(reply,id,req.sessionId);return {ok:true};
 });
 app.post('/api/logout',async(req,reply)=>{await db.query('DELETE FROM sessions WHERE token_hash=$1',[req.sessionId]);reply.clearCookie('volta_session',{path:'/'});return {ok:true};});
 app.get('/auth/login',async(req,reply)=>{
  if(preview)return reply.redirect('/jornal');
  const codeVerifier=oidc.randomPKCECodeVerifier(),state=oidc.randomState(),nonce=oidc.randomNonce(),binding=random();
  await db.query("INSERT INTO oidc_flows(id,state,verifier,nonce,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')",[digest(binding),state,codeVerifier,nonce]);
  reply.setCookie('volta_oidc',binding,{path:'/auth',httpOnly:true,secure:true,sameSite:'lax',maxAge:600});
  return reply.redirect(oidc.buildAuthorizationUrl(identity!,{redirect_uri:origin+'/auth/callback',scope:'openid profile',state,nonce,code_challenge:await oidc.calculatePKCECodeChallenge(codeVerifier),code_challenge_method:'S256'}).href);
 });
 app.get('/auth/callback',async(req,reply)=>{
  if(preview)fail(404,'Rota não encontrada.');
  const binding=req.cookies.volta_oidc;if(!binding)fail(400,'Entrada expirada. Inicie novamente.');
  const flow=(await db.query('DELETE FROM oidc_flows WHERE id=$1 AND expires_at>now() RETURNING *',[digest(binding!)])).rows[0];
  if(!flow)fail(400,'Entrada expirada. Inicie novamente.');
  reply.clearCookie('volta_oidc',{path:'/auth'});
  const tokens=await oidc.authorizationCodeGrant(identity!,new URL(req.url,origin),{pkceCodeVerifier:flow.verifier,expectedState:flow.state,expectedNonce:flow.nonce,idTokenExpected:true});
  const claims=tokens.claims();if(!claims?.sub)fail(403,'Identidade não confirmada pelo provedor.');
  const issuerNamespace=process.env.OIDC_ISSUER||identity!.serverMetadata().issuer;
  const member=(await db.query('SELECT id FROM members WHERE oidc_sub=$1 AND active=true',[issuerNamespace+'|'+claims!.sub])).rows[0];
  if(!member)fail(403,'Esta identidade ainda não foi convidada para a VOLTA.');
  await session(reply,member.id,req.sessionId);return reply.redirect('/jornal');
 });
 await registerDomain(app,db);
 const files:Record<string,string>={'/':'journey.html','/index.html':'journey.html','/journey.html':'journey.html','/jornal':'workspace.html','/workspace.js':'workspace.js','/workspace.css':'workspace.css','/expressive.css':'expressive.css','/personality.js':'personality.js','/voice.js':'voice.js','/assets/volta-symbol.svg':'assets/volta-symbol.svg','/journey.js':'journey.js','/journey.css':'journey.css','/favicon.svg':'favicon.svg'};
 files['/orbit-scene.js']='orbit-scene.js';files['/studio.css']='studio.css';files['/arrival.js']='arrival.js';files['/assets/surface-grain.svg']='assets/surface-grain.svg';files['/vendor/three.module.js']='node_modules/three/build/three.module.js';files['/vendor/three.core.js']='node_modules/three/build/three.core.js';
 for(const font of ['space-grotesk','manrope'])for(const weight of [400,500,600,700])files[`/assets/fonts/${font}-${weight}.ttf`]=`assets/fonts/${font}-${weight}.ttf`;
 const assets=['pesquisa-cinco-forcas.png','referencia-pet.jpg','referencia-lata.jpg','central-prototipo.png','CREDITOS.md'];for(const asset of assets)files['/assets/'+asset]='assets/'+asset;
 const types:Record<string,string>={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'application/javascript; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',md:'text/plain; charset=utf-8',ttf:'font/ttf'};
 app.get('/jornal/',async(_,reply)=>reply.redirect('/jornal',308));
 for(const [route,file] of Object.entries(files))app.get(route,async(req,reply)=>{
  // Private repository artwork is not implicitly approved for public hosting.
  if(!preview&&(route==='/'||route==='/index.html'||route==='/journey.html'||(route.startsWith('/assets/')&&route!=='/assets/volta-symbol.svg'&&route!=='/assets/surface-grain.svg'&&!route.startsWith('/assets/fonts/')))&&!req.user)return reply.redirect('/auth/login');
  const content=await readFile(fileURLToPath(new URL('../'+file,import.meta.url)));
  return reply.header('Cache-Control','no-store').type(types[file.split('.').at(-1)!]||'application/octet-stream').send(content);
 });
 app.get('/health',async()=>({status:'ok',mode:preview?'preview':'oidc'}));
 return app;
}
