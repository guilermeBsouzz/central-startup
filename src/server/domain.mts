import { createHash, randomUUID } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';

// Structural contracts keep this module independent of the database driver and auth module.
type Row = Record<string, any>;
type Body = Record<string, unknown>;
export interface DomainClient {
  query(sql: string, params?: any[]): Promise<{ rows: Row[] }>;
}
export interface DomainDatabase extends DomainClient {
  transaction<T>(fn: (client: DomainClient) => Promise<T>): Promise<T>;
}
interface Member {
  id: string;
  name: string;
  role: string;
  active?: boolean;
  interests?: string[];
  preferences: Record<string, unknown>;
}
type MutationResult = { ok: true; id: string; version?: number };
const priorities = ['Alta', 'Média', 'Baixa'] as const;
const taskStatuses = ['A fazer', 'Fazendo', 'Em revisão', 'Feito', 'Cancelado'] as const;
const terminalTaskStatuses = new Set(['Feito', 'Cancelado']);
const helpStatuses = ['Aberto', 'Em atendimento', 'Resolvido', 'Cancelado'] as const;
const publicationStatuses = ['Publicado', 'Cancelado', 'Encerrado'] as const;
const domainError = Symbol('domainError');
const has = (body: Body, key: string) => Object.hasOwn(body, key);

function fail(statusCode: 400 | 403 | 404 | 409, message: string): never {
  throw Object.assign(new Error(message), { statusCode, [domainError]: true });
}

function object(value: unknown, field = 'Corpo'): Body {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, `${field} inválido.`);
  return value as Body;
}

function fields(body: Body, allowed: readonly string[], required: readonly string[] = []): void {
  if (Object.keys(body).some(key => !allowed.includes(key))) fail(400, 'Campo não permitido.');
  if (required.some(key => !has(body, key))) fail(400, 'Campo obrigatório ausente.');
}

function text(value: unknown, field: string, max = 20000, required = true): string {
  if (typeof value !== 'string') fail(400, `${field} deve ser texto.`);
  const result = value.trim();
  if ((required && !result) || result.length > max || result.includes('\0')) fail(400, `${field} inválido.`);
  return result;
}

function optionalText(body: Body, key: string, max = 20000): string {
  return has(body, key) ? text(body[key], key, max, false) : '';
}

function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) fail(400, `${field} inválido.`);
  return value as T;
}

function version(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) >= 2147483647) fail(400, 'Versão inválida.');
  return value as number;
}

function expected(row: Row, value: unknown): void {
  if (row.version !== version(value)) fail(409, 'Registro alterado por outra pessoa. Recarregue antes de salvar.');
}

function identifier(value: unknown): string { return text(value, 'Identificador', 200); }
function routeId(request: FastifyRequest): string { return identifier(object(request.params, 'Parâmetros').id); }

function dateOnly(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(400, 'Prazo deve ser uma data YYYY-MM-DD.');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value || value.startsWith('0000')) fail(400, 'Prazo inválido.');
  return value;
}

function timestamp(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    fail(400, `${field} deve conter data, hora e fuso ISO 8601.`);
  }
  dateOnly(value.slice(0, 10));
  const time = value.slice(11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/)!;
  const offset = value.match(/[+-](\d{2}):(\d{2})$/);
  if (+time[1] > 23 || +time[2] > 59 || +(time[3] ?? 0) > 59 ||
      (offset && (+offset[1] > 14 || +offset[2] > 59 || (+offset[1] === 14 && +offset[2] !== 0)))) fail(400, `${field} inválido.`);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.valueOf())) fail(400, `${field} inválido.`);
  return parsed.toISOString();
}

function url(value: unknown): string {
  const result = text(value, 'Link', 2048, false);
  if (!result) return '';
  let parsed: URL;
  try { parsed = new URL(result); } catch { fail(400, 'Link inválido.'); }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) fail(400, 'Link deve usar HTTP ou HTTPS sem credenciais.');
  return parsed.href;
}

function ids(value: unknown, field: string, required = false): string[] {
  if (!Array.isArray(value) || value.length > 100 || (required && value.length === 0)) fail(400, `${field} inválidos.`);
  return [...new Set(value.map(identifier))];
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Body)[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
function hash(value: string): string { return createHash('sha256').update(value, 'utf8').digest('hex'); }

function authenticated(request: FastifyRequest): Member {
  const user = (request as unknown as { user?: Member }).user;
  if (!user?.id || user.active === false) fail(403, 'Membro ativo obrigatório.');
  return user;
}

async function one(client: DomainClient, sql: string, params: any[]): Promise<Row> {
  const row = (await client.query(sql, params)).rows[0];
  if (!row) fail(404, 'Registro não encontrado.');
  return row;
}

async function activeMembers(client: DomainClient, members: string[]): Promise<void> {
  if (!members.length) return;
  const result = await client.query('SELECT id FROM members WHERE id = ANY($1::text[]) AND active = true', [members]);
  if (result.rows.length !== members.length) fail(400, 'Selecione somente membros ativos existentes.');
}

// Audit only technical, allowlisted facts: never session tokens, OIDC data or freeform content.
function auditData(row: Row | null): Row | null {
  if (!row) return null;
  const allowed = ['id', 'version', 'owner_id', 'creator_id', 'author_id', 'task_id', 'publication_id', 'help_id',
    'member_id', 'status', 'state', 'priority', 'progress', 'previous_progress', 'type', 'due_date',
    'starts_at', 'ends_at', 'deadline', 'read_at', 'confirmed_at', 'hash'];
  return Object.fromEntries(allowed.filter(key => has(row, key)).map(key => [key, row[key]]));
}

async function audit(client: DomainClient, actor: Member, action: string, entity: string, id: string, before: Row | null, after: Row | null): Promise<void> {
  await client.query(`INSERT INTO audit_log (id,actor_id,action,entity_type,entity_id,before_data,after_data)
    VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
  [randomUUID(), actor.id, action, entity, id, JSON.stringify(auditData(before)), JSON.stringify(auditData(after))]);
}

async function notify(client: DomainClient, memberId: string, type: string, title: string, body: string,
  links: { task_id?: string | null; publication_id?: string | null; help_id?: string | null }, dedupeKey: string): Promise<void> {
  await client.query(`INSERT INTO notifications (id,member_id,type,title,body,task_id,publication_id,help_id,dedupe_key)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (dedupe_key) DO NOTHING`,
  [randomUUID(), memberId, type, title, body, links.task_id ?? null, links.publication_id ?? null, links.help_id ?? null, dedupeKey]);
}

function owned(row: Row, actor: Member, field = 'owner_id'): void {
  if (row[field] !== actor.id && actor.role !== 'admin') fail(403, 'Somente o responsável ou administrador pode editar.');
}

function result(row: Row): MutationResult {
  return { ok: true, id: row.id, ...(row.version === undefined ? {} : { version: row.version }) };
}

function preferencePatch(value: unknown): Body {
  const input = object(value, 'Preferências');
  fields(input, ['theme', 'palette', 'textScale', 'reducedMotion', 'timezone','artMode']);
  const output: Body = {};
  if(has(input,'artMode'))output.artMode=choice(input.artMode,['personal','neutral'],'Arte pessoal');
  if (has(input, 'theme')) output.theme = choice(input.theme, ['default', 'high-contrast','protanopia','deuteranopia','tritanopia'], 'Tema');
  if (has(input, 'palette')) output.palette = choice(input.palette, ['default', 'protanopia', 'deuteranopia', 'tritanopia'], 'Paleta');
  if (has(input, 'textScale')) {
    if (![100, 125, 150, 200].includes(input.textScale as number)) fail(400, 'Escala de texto inválida.');
    output.textScale = input.textScale;
  }
  if (has(input, 'reducedMotion')) {
    if (typeof input.reducedMotion !== 'boolean') fail(400, 'Movimento reduzido inválido.');
    output.reducedMotion = input.reducedMotion;
  }
  if (has(input, 'timezone')) {
    const zone = text(input.timezone, 'Fuso', 100);
    try { new Intl.DateTimeFormat('pt-BR', { timeZone: zone }).format(); }
    catch { fail(400, 'Fuso horário inválido.'); }
    output.timezone = zone;
  }
  return output;
}

const publicationFields = ['type', 'title', 'description', 'priority', 'starts_at', 'ends_at', 'deadline', 'location', 'url'] as const;
function publicationInput(body: Body, previous?: Row): Row {
  const output: Row = previous ? { ...previous } : {
    type: 'evento', description: '', priority: 'Média', starts_at: null, ends_at: null,
    deadline: null, location: '', url: '', status: 'Publicado',
  };
  if (has(body, 'type')) output.type = choice(body.type, ['evento', 'oportunidade'], 'Tipo');
  if (has(body, 'title')) output.title = text(body.title, 'Título', 160);
  if (has(body, 'description')) output.description = optionalText(body, 'description');
  if (has(body, 'priority')) output.priority = choice(body.priority, priorities, 'Prioridade');
  for (const key of ['starts_at', 'ends_at', 'deadline']) if (has(body, key)) output[key] = timestamp(body[key], key);
  if (has(body, 'location')) output.location = text(body.location, 'Local', 1000, false);
  if (has(body, 'url')) output.url = url(body.url);
  if (has(body, 'status')) output.status = choice(body.status, publicationStatuses, 'Estado');
  if (output.ends_at && !output.starts_at) fail(400, 'Informe o início antes do fim.');
  if (output.starts_at && output.ends_at && new Date(output.ends_at).valueOf() < new Date(output.starts_at).valueOf()) fail(400, 'Fim anterior ao início.');
  return output;
}

function sameInstant(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return a == null && b == null;
  return new Date(a as string).valueOf() === new Date(b as string).valueOf();
}

async function eventNotifications(client: DomainClient, publication: Row): Promise<void> {
  const members = (await client.query('SELECT id FROM members WHERE active = true ORDER BY id', [])).rows;
  for (const member of members) {
    await notify(client, member.id, 'event', publication.status==='Cancelado' ? `Evento cancelado: ${publication.title}` : publication.title,
      `Evento de alta importância — ${publication.status}. Consulte os detalhes atualizados.`,
      { publication_id: publication.id }, `event:${publication.id}:${publication.version}:${member.id}`);
  }
}

/** Register team-domain endpoints. Authentication/CSRF and the session endpoints belong to main. */
export async function registerDomain(app: FastifyInstance, db: DomainDatabase): Promise<void> {
  const safe = (handler: (request: FastifyRequest) => Promise<unknown>) => async (request: FastifyRequest) => {
    try { return await handler(request); }
    catch (error: unknown) {
      if (error && typeof error === 'object' && domainError in error) throw error;
      const code = (error as { code?: string } | null)?.code;
      if (['23505', '40001', '40P01'].includes(code ?? '')) fail(409, 'Conflito ao salvar. Recarregue e tente novamente.');
      if (['23503', '23514', '22001', '22007', '22008', '22P02'].includes(code ?? '')) fail(400, 'Dados inválidos para esta operação.');
      // Never expose PostgreSQL statements, constraint details or driver errors to the browser.
      throw Object.assign(new Error('Não foi possível concluir a operação.'), { statusCode: 500 });
    }
  };

  async function mutate(request: FastifyRequest, route: string, idempotent: boolean,
    operation: (client: DomainClient, actor: Member, body: Body) => Promise<MutationResult>): Promise<MutationResult> {
    const sessionActor = authenticated(request);
    const body = object(request.body ?? {});
    let key = '';
    if (idempotent) {
      const header = request.headers['idempotency-key'];
      if (typeof header !== 'string' || !/^[\x21-\x7e]{8,120}$/.test(header)) fail(400, 'Idempotency-Key deve ter entre 8 e 120 caracteres sem espaços.');
      key = header;
    }
    const payloadHash = idempotent ? hash(canonical(body)) : '';
    return db.transaction(async client => {
      // Serialize writes for this member before testing the idempotency key.
      const actor = (await client.query(`SELECT id,name,role,active,interests,preferences FROM members
        WHERE id = $1 FOR NO KEY UPDATE`, [sessionActor.id])).rows[0] as Member | undefined;
      if (!actor || !actor.active) fail(403, 'Membro inativo ou inexistente.');
      if (idempotent) {
        const prior = (await client.query('SELECT route,payload_hash,response FROM idempotency WHERE member_id = $1 AND key = $2', [actor.id, key])).rows[0];
        if (prior) {
          if (prior.route !== route || prior.payload_hash !== payloadHash) fail(409, 'Idempotency-Key já utilizado com outra operação ou conteúdo.');
          return prior.response as MutationResult;
        }
      }
      const response = await operation(client, actor, body);
      if (idempotent) await client.query(`INSERT INTO idempotency (member_id,key,route,payload_hash,response)
        VALUES ($1,$2,$3,$4,$5::jsonb)`, [actor.id, key, route, payloadHash, JSON.stringify(response)]);
      return response;
    });
  }

  app.get('/api/state', safe(async request => {
    const actor = authenticated(request);
    return db.transaction(async client => {
      // One snapshot prevents a task's percentage and its reports from coming from different commits.
      await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY', []);
      const me = (await client.query('SELECT id,name,role,active,interests,preferences FROM members WHERE id = $1 AND active = true', [actor.id])).rows[0];
      if (!me) fail(403, 'Membro inativo ou inexistente.');
      const members = (await client.query('SELECT id,name,role,active,interests FROM members ORDER BY name,id', [])).rows;
      // DATE is a civil day, not an instant; pg and PGlite must expose the same YYYY-MM-DD.
      const tasks = (await client.query(`SELECT t.*,t.due_date::text AS due_date FROM tasks t ORDER BY
        CASE t.priority WHEN 'Alta' THEN 0 WHEN 'Média' THEN 1 ELSE 2 END,
        t.due_date ASC NULLS LAST,t.updated_at DESC,t.id`, [])).rows;
      const reports = (await client.query('SELECT * FROM reports ORDER BY created_at,id', [])).rows;
      const comments = (await client.query(`SELECT c.*,COALESCE((SELECT jsonb_agg(m.member_id ORDER BY m.member_id)
        FROM comment_mentions m WHERE m.comment_id = c.id),'[]'::jsonb) AS mentions
        FROM comments c ORDER BY c.created_at,c.id`, [])).rows;
      const publications = (await client.query(`SELECT * FROM publications ORDER BY
        CASE priority WHEN 'Alta' THEN 0 WHEN 'Média' THEN 1 ELSE 2 END,
        COALESCE(starts_at,deadline) ASC NULLS LAST,updated_at DESC,id`, [])).rows;
      const helpRequests = (await client.query(`SELECT h.*,COALESCE((SELECT jsonb_agg(
        jsonb_build_object('member_id',r.member_id,'state',r.state) ORDER BY r.member_id)
        FROM help_recipients r WHERE r.help_id = h.id),'[]'::jsonb) AS recipients
        FROM help_requests h ORDER BY h.updated_at DESC,h.id`, [])).rows;
      // A cancelled event's old invitation is hidden. Its actual cancellation notice remains
      // visible, identified by the audited version rather than parsing notification prose.
      const notifications = (await client.query(`SELECT n.* FROM notifications n
        LEFT JOIN publications p ON p.id=n.publication_id
        WHERE n.member_id=$1 AND (
          n.type <> 'event' OR (
            p.type='evento' AND p.priority='Alta' AND p.status='Publicado'
            AND (COALESCE(p.ends_at,p.starts_at) IS NULL OR COALESCE(p.ends_at,p.starts_at)>=now())
          ) OR (
            p.status='Cancelado' AND EXISTS (
              SELECT 1 FROM audit_log a WHERE a.entity_type='publication' AND a.entity_id=p.id
              AND a.after_data->>'status'='Cancelado'
              AND n.dedupe_key='event:' || p.id || ':' || (a.after_data->>'version') || ':' || n.member_id
            )
          )
        ) ORDER BY n.created_at DESC,n.id`, [actor.id])).rows;
      const documents = (await client.query(`SELECT id,title,body,state,file_name,hash,author_id,created_at,
        visibility FROM documents WHERE visibility='Equipe' OR author_id=$1 ORDER BY created_at DESC,id`, [actor.id])).rows;
      const help = helpRequests.map(row=>({...row,recipient_states:row.recipients,recipients:row.recipients.map((recipient:Row)=>recipient.member_id)}));
      return { me, members, tasks, reports, comments, publications, helpRequests:help, notifications, documents,
        mode: (app as FastifyInstance & { preview?: boolean }).preview ? 'preview' : 'oidc' };
    });
  }));

  app.post('/api/tasks', safe(async request => mutate(request, 'POST /api/tasks', true, async (client, actor, body) => {
    fields(body, ['title', 'description', 'owner_id', 'project', 'priority', 'due_date'], ['title', 'owner_id']);
    const owner = identifier(body.owner_id);
    await activeMembers(client, [owner]);
    const row = await one(client, `INSERT INTO tasks
      (id,title,description,owner_id,creator_id,project,status,priority,progress,due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [randomUUID(), text(body.title, 'Título', 160), optionalText(body, 'description'), owner, actor.id,
      optionalText(body, 'project', 300), 'A fazer', has(body, 'priority') ? choice(body.priority, priorities, 'Prioridade') : 'Média',
      0, has(body, 'due_date') ? dateOnly(body.due_date) : null]);
    await audit(client, actor, 'create', 'task', row.id, null, row);
    return result(row);
  })));

  app.patch('/api/tasks/:id', safe(async request => {
    const id = routeId(request);
    return mutate(request, `PATCH /api/tasks/${id}`, false, async (client, actor, body) => {
      fields(body, ['version', 'title', 'description', 'priority', 'due_date'], ['version']);
      const before = await one(client, 'SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [id]);
      owned(before, actor);
      expected(before, body.version);
      const after = await one(client, `UPDATE tasks SET title=$1,description=$2,priority=$3,due_date=$4,
        version=version+1,updated_at=now() WHERE id=$5 AND version=$6 RETURNING *`,
      [has(body, 'title') ? text(body.title, 'Título', 160) : before.title,
        has(body, 'description') ? optionalText(body, 'description') : before.description,
        has(body, 'priority') ? choice(body.priority, priorities, 'Prioridade') : before.priority,
        has(body, 'due_date') ? dateOnly(body.due_date) : before.due_date, id, before.version]);
      await audit(client, actor, 'update', 'task', id, before, after);
      return result(after);
    });
  }));

  app.post('/api/tasks/:id/progress', safe(async request => {
    const id = routeId(request);
    return mutate(request, `POST /api/tasks/${id}/progress`, true, async (client, actor, body) => {
      fields(body, ['version', 'progress', 'narrative', 'next_step', 'status', 'reason'], ['version', 'progress', 'narrative', 'next_step']);
      const before = await one(client, 'SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [id]);
      if (before.owner_id !== actor.id) fail(403, 'Somente o responsável pode registrar progresso.');
      expected(before, body.version);
      if (!Number.isInteger(body.progress) || (body.progress as number) < 0 || (body.progress as number) > 100) fail(400, 'Percentual deve ser inteiro entre 0 e 100.');
      const progress = body.progress as number;
      const narrative = text(body.narrative, 'Relato');
      const nextStep = text(body.next_step, 'Próximo passo');
      const status = has(body, 'status') ? choice(body.status, taskStatuses, 'Estado') : before.status;
      const reason = optionalText(body, 'reason');
      if ((progress < before.progress || (terminalTaskStatuses.has(before.status) && status !== before.status)) && !reason) fail(400, 'Redução de percentual ou reabertura exige justificativa.');
      if (status === 'Feito' && progress !== 100) fail(400, 'Feito exige 100% e relato.');
      const report = await one(client, `INSERT INTO reports
        (id,task_id,author_id,previous_progress,progress,narrative,next_step,reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [randomUUID(), id, actor.id, before.progress, progress, narrative, nextStep, reason]);
      const after = await one(client, `UPDATE tasks SET progress=$1,status=$2,version=version+1,updated_at=now()
        WHERE id=$3 AND version=$4 RETURNING *`, [progress, status, id, before.version]);
      await audit(client, actor, 'create', 'report', report.id, null, report);
      await audit(client, actor, 'progress', 'task', id, before, after);
      return result(after);
    });
  }));

  app.post('/api/comments', safe(async request => mutate(request, 'POST /api/comments', true, async (client, actor, body) => {
    fields(body, ['task_id', 'publication_id', 'text', 'priority', 'mentions'], ['text']);
    const taskId = body.task_id == null ? null : identifier(body.task_id);
    const publicationId = body.publication_id == null ? null : identifier(body.publication_id);
    if (Boolean(taskId) === Boolean(publicationId)) fail(400, 'Informe exatamente uma atividade ou publicação.');
    if (taskId) await one(client, 'SELECT id FROM tasks WHERE id=$1', [taskId]);
    if (publicationId) await one(client, 'SELECT id FROM publications WHERE id=$1', [publicationId]);
    const mentions = has(body, 'mentions') ? ids(body.mentions, 'Mencionados') : [];
    await activeMembers(client, mentions);
    const content = text(body.text, 'Comentário');
    const row = await one(client, `INSERT INTO comments (id,task_id,publication_id,author_id,text,priority)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [randomUUID(), taskId, publicationId, actor.id, content, has(body, 'priority') ? choice(body.priority, priorities, 'Prioridade') : 'Média']);
    for (const memberId of mentions) {
      await client.query('INSERT INTO comment_mentions (comment_id,member_id) VALUES ($1,$2)', [row.id, memberId]);
      await notify(client, memberId, 'mention', `${actor.name} mencionou você`, content,
        { task_id: taskId, publication_id: publicationId }, `mention:${row.id}:${memberId}`);
    }
    await audit(client, actor, 'create', 'comment', row.id, null, row);
    return result(row);
  })));

  app.patch('/api/comments/:id', safe(async request => {
    const id = routeId(request);
    return mutate(request, `PATCH /api/comments/${id}`, false, async (client, actor, body) => {
      fields(body, ['version', 'priority'], ['version', 'priority']);
      const before = await one(client, 'SELECT * FROM comments WHERE id=$1 FOR UPDATE', [id]);
      expected(before, body.version);
      const after = await one(client, 'UPDATE comments SET priority=$1,version=version+1 WHERE id=$2 AND version=$3 RETURNING *',
        [choice(body.priority, priorities, 'Prioridade'), id, before.version]);
      await audit(client, actor, 'priority', 'comment', id, before, after);
      return result(after);
    });
  }));

  app.post('/api/help', safe(async request => mutate(request, 'POST /api/help', true, async (client, actor, body) => {
    fields(body, ['task_id', 'text', 'priority', 'recipients'], ['task_id', 'text', 'recipients']);
    const taskId = identifier(body.task_id);
    await one(client, 'SELECT id FROM tasks WHERE id=$1', [taskId]);
    const recipients = ids(body.recipients, 'Destinatários', true);
    await activeMembers(client, recipients);
    const content = text(body.text, 'Pedido de ajuda');
    const row = await one(client, `INSERT INTO help_requests (id,task_id,author_id,text,priority,status)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [randomUUID(), taskId, actor.id, content, has(body, 'priority') ? choice(body.priority, priorities, 'Prioridade') : 'Média', 'Aberto']);
    for (const memberId of recipients) {
      await client.query('INSERT INTO help_recipients (help_id,member_id,state) VALUES ($1,$2,$3)', [row.id, memberId, 'Pendente']);
      await notify(client, memberId, 'help', `${actor.name} pediu ajuda`, content,
        { task_id: taskId, help_id: row.id }, `help:${row.id}:${memberId}`);
    }
    await audit(client, actor, 'create', 'help', row.id, null, row);
    return result(row);
  })));

  app.patch('/api/help/:id', safe(async request => {
    const id = routeId(request);
    return mutate(request, `PATCH /api/help/${id}`, false, async (client, actor, body) => {
      fields(body, ['version', 'status'], ['version', 'status']);
      const before = await one(client, 'SELECT * FROM help_requests WHERE id=$1 FOR UPDATE', [id]);
      expected(before, body.version);
      const status = choice(body.status, helpStatuses, 'Estado');
      if (status === 'Em atendimento') {
        const recipient = (await client.query('SELECT member_id,state FROM help_recipients WHERE help_id=$1 AND member_id=$2', [id, actor.id])).rows[0];
        if (!recipient) fail(403, 'Somente destinatários podem aceitar o pedido.');
        if (!['Aberto', 'Em atendimento'].includes(before.status)) fail(409, 'O autor precisa reabrir este pedido antes do atendimento.');
        await client.query('UPDATE help_recipients SET state=$1 WHERE help_id=$2 AND member_id=$3', ['Em atendimento', id, actor.id]);
        await audit(client, actor, 'accept', 'help_recipient', id, { ...recipient, help_id: id }, { ...recipient, help_id: id, state: 'Em atendimento' });
      } else {
        if (before.author_id !== actor.id) fail(403, 'Somente o autor pode encerrar, cancelar ou reabrir.');
        if (status === 'Aberto' && !['Resolvido', 'Cancelado'].includes(before.status)) fail(409, 'Somente pedidos encerrados podem ser reabertos.');
        if (status === 'Aberto') await client.query('UPDATE help_recipients SET state=$1 WHERE help_id=$2', ['Pendente', id]);
      }
      const after = await one(client, `UPDATE help_requests SET status=$1,version=version+1,updated_at=now()
        WHERE id=$2 AND version=$3 RETURNING *`, [status, id, before.version]);
      await audit(client, actor, 'status', 'help', id, before, after);
      return result(after);
    });
  }));

  app.post('/api/publications', safe(async request => mutate(request, 'POST /api/publications', true, async (client, actor, body) => {
    fields(body, publicationFields, ['type', 'title']);
    const input = publicationInput(body);
    const row = await one(client, `INSERT INTO publications
      (id,type,title,description,priority,starts_at,ends_at,deadline,location,url,status,author_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [randomUUID(), input.type, input.title, input.description, input.priority, input.starts_at, input.ends_at,
      input.deadline, input.location, input.url, input.status, actor.id]);
    if (row.type === 'evento' && row.priority === 'Alta') await eventNotifications(client, row);
    await audit(client, actor, 'create', 'publication', row.id, null, row);
    return result(row);
  })));

  app.patch('/api/publications/:id', safe(async request => {
    const id = routeId(request);
    return mutate(request, `PATCH /api/publications/${id}`, false, async (client, actor, body) => {
      fields(body, ['version', 'status', ...publicationFields], ['version']);
      const before = await one(client, 'SELECT * FROM publications WHERE id=$1 FOR UPDATE', [id]);
      owned(before, actor, 'author_id');
      expected(before, body.version);
      const input = publicationInput(body, before);
      const after = await one(client, `UPDATE publications SET type=$1,title=$2,description=$3,priority=$4,
        starts_at=$5,ends_at=$6,deadline=$7,location=$8,url=$9,status=$10,version=version+1,updated_at=now()
        WHERE id=$11 AND version=$12 RETURNING *`,
      [input.type, input.title, input.description, input.priority, input.starts_at, input.ends_at, input.deadline,
        input.location, input.url, input.status, id, before.version]);
      const material = ['starts_at', 'ends_at', 'deadline'].some(key => !sameInstant(before[key], after[key])) ||
        ['location', 'url', 'status', 'type', 'priority'].some(key => before[key] !== after[key]);
      // Includes cancellation; orthographic edits alone never create a new alert.
      if (material && ((after.type === 'evento' && after.priority === 'Alta') || (before.type === 'evento' && before.priority === 'Alta'))) {
        await eventNotifications(client, after);
      }
      await audit(client, actor, 'update', 'publication', id, before, after);
      return result(after);
    });
  }));

  for (const action of ['read', 'confirm'] as const) {
    app.post(`/api/notifications/:id/${action}`, safe(async request => {
      const id = routeId(request);
      return mutate(request, `POST /api/notifications/${id}/${action}`, false, async (client, actor, body) => {
        fields(body, []);
        const before = await one(client, 'SELECT * FROM notifications WHERE id=$1 AND member_id=$2 FOR UPDATE', [id, actor.id]);
        const field = action === 'read' ? 'read_at' : 'confirmed_at';
        if (before[field] != null) return result(before);
        // Confirmation and reading remain distinct facts; neither marks the other automatically.
        const sql = action === 'read'
          ? 'UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE id=$1 AND member_id=$2 RETURNING *'
          : 'UPDATE notifications SET confirmed_at=COALESCE(confirmed_at,now()) WHERE id=$1 AND member_id=$2 RETURNING *';
        const after = await one(client, sql, [id, actor.id]);
        await audit(client, actor, action, 'notification', id, before, after);
        return result(after);
      });
    }));
  }

  app.patch('/api/me', safe(async request => mutate(request, 'PATCH /api/me', false, async (client, actor, body) => {
    fields(body, ['interests', 'preferences']);
    let interests = actor.interests ?? [];
    if (has(body, 'interests')) {
      if (!Array.isArray(body.interests) || body.interests.length > 30) fail(400, 'Interesses inválidos.');
      interests = [...new Set(body.interests.map(value => text(value, 'Interesse', 100)))];
    }
    const preferences = has(body, 'preferences') ? { ...actor.preferences, ...preferencePatch(body.preferences) } : actor.preferences;
    const after = await one(client, 'UPDATE members SET interests=$1::jsonb,preferences=$2::jsonb WHERE id=$3 RETURNING id',
      [JSON.stringify(interests), JSON.stringify(preferences ?? {}), actor.id]);
    await audit(client, actor, 'preferences', 'member', actor.id, { id: actor.id }, after);
    return result(after);
  })));

  app.post('/api/documents', { bodyLimit: 7 * 1024 * 1024 }, safe(async request => mutate(request, 'POST /api/documents', true, async (client, actor, body) => {
    fields(body, ['title', 'body', 'file_name', 'visibility'], ['title', 'body', 'file_name']);
    const title = text(body.title, 'Título', 300);
    const fileName = text(body.file_name, 'Arquivo', 255);
    if (!/\.(?:md|txt)$/i.test(fileName) || /[\\/\x00-\x1f\x7f]/.test(fileName) || fileName === '.' || fileName === '..') fail(400, 'Envie somente arquivo MD ou TXT, sem caminho.');
    if (typeof body.body !== 'string' || body.body.includes('\0') || Buffer.byteLength(body.body, 'utf8') > 1024 * 1024) fail(400, 'Documento deve ser texto UTF-8 de até 1 MB.');
    const contentHash = hash(body.body);
    const visibility = has(body,'visibility') ? choice(body.visibility,['Restrito','Equipe'],'Visibilidade') : 'Restrito';
    // A transaction advisory lock also deduplicates simultaneous uploads by different members.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`document:${fileName}:${contentHash}`]);
    const existing = (await client.query('SELECT id FROM documents WHERE file_name=$1 AND hash=$2 AND author_id=$3 AND visibility=$4 ORDER BY created_at,id LIMIT 1', [fileName, contentHash,actor.id,visibility])).rows[0];
    if (existing) return result(existing);
    const row = await one(client, `INSERT INTO documents (id,title,body,state,file_name,hash,author_id,visibility)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [randomUUID(), title, body.body, 'Validação pendente', fileName, contentHash, actor.id,visibility]);
    await audit(client, actor, 'create', 'document', row.id, null, row);
    return result(row);
  })));
}
