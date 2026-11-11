import 'fastify';
declare module 'fastify' {
 interface FastifyRequest {user:any;sessionId:string|null;csrfToken:string|null;}
 interface FastifyInstance {preview:boolean;}
}
