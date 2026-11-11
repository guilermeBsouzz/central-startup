import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../src/app.mts';

test('Vercel entry exports a handler and fails safely without production configuration',async()=>{
 assert.equal(typeof handler,'function');
 const previous=process.env.DATABASE_URL;
 const originalError=console.error;
 delete process.env.DATABASE_URL;
 let logged=false,body='';const headers={};
 console.error=()=>{logged=true;};
 const response={statusCode:200,setHeader:(name,value)=>{headers[name]=value;},end:value=>{body=value;}};
 try{
  await handler({},response);
  assert.equal(response.statusCode,503);
  assert.equal(headers['Cache-Control'],'no-store');
  assert.ok(logged);
  assert.match(JSON.parse(body).error,/indisponível/);
  assert.ok(!body.includes('DATABASE_URL'));
 }finally{
  console.error=originalError;
  if(previous===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previous;
 }
});
