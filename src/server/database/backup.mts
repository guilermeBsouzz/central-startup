import { createHash } from 'node:crypto';
import type { Database } from './client.mts';
// Deliberately excludes browser sessions and OAuth challenges.
const tables = [
    'members', 'tasks', 'reports', 'publications', 'comments', 'comment_mentions', 'help_requests', 'help_recipients', 'notifications', 'documents', 'audit_log', 'idempotency'
];
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export async function snapshot(db: Database) {
    const data = await db.transaction(async (tx) => {
        await tx.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        const records: Record<string, any[]> = {};
        for (const table of tables)
            records[table] = (await tx.query(`SELECT * FROM ${table}`)).rows;
        return { version: 1, createdAt: new Date().toISOString(), records };
    });
    const payload = JSON.stringify(data);
    return JSON.stringify({ sha256: hash(payload), payload });
}
export async function restoreEmpty(db: Database, contents: string) {
    const envelope = JSON.parse(contents);
    if (typeof envelope.payload !== 'string' || hash(envelope.payload) !== envelope.sha256)
        throw new Error('Backup inválido: hash não confere.');
    const data = JSON.parse(envelope.payload);
    if (data.version !== 1 || tables.some(t => !Array.isArray(data.records?.[t])))
        throw new Error('Formato de backup não suportado.');
    await db.transaction(async (tx) => {
        for (const table of [...tables.filter(t => t !== 'members'), 'sessions', 'oidc_flows']) {
            const count = Number((await tx.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
            if (count)
                throw new Error('Restauração exige banco vazio; nenhum dado existente foi removido.');
        }
        const bound = (await tx.query('SELECT id FROM members WHERE oidc_sub IS NOT NULL')).rows;
        if (bound.length)
            throw new Error('Destino já possui identidades vinculadas. Use um banco novo.');
        await tx.query('DELETE FROM members');
        for (const table of tables)
            for (const row of data.records[table])
                await tx.query(`INSERT INTO ${table} SELECT (json_populate_record(NULL::${table},$1::json)).*`, [JSON.stringify(row)]);
    });
}
