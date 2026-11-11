import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { readFile, mkdir, open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
export interface Queryable {
    query(sql: string, params?: any[]): Promise<{
        rows: any[];
    }>;
}
export interface Database extends Queryable {
    transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
    close(): Promise<void>;
    kind: string;
}
export const MEMBERS = [
    ['jose-isaias', 'José Isaías', ['Computação', 'Redes neurais', 'Nordeste', 'Empreendedorismo']],
    ['clara-prado', 'Clara Prado', ['Direito', 'Oratória', 'Palestras', 'Fórmula 1']],
    ['amanda', 'Amanda', ['Finanças', 'Mercado financeiro', 'Fofocas']],
    ['julia-alves', 'Júlia Alves', ['Finanças', 'Mercado financeiro', 'Empreendedorismo']],
    ['igor', 'Igor', ['Esportes', 'Trabalho', 'Família', 'Filmes']],
    ['guilherme', 'Guilherme', ['Anime', 'Vôlei', 'Matemática']],
    ['jose-roberto', 'José Roberto', ['Luta', 'Jogos antigos', 'Computação']]
] as const;
export async function openDatabase(options: {
    url?: string;
    dataDir?: string;
    preview: boolean;
}): Promise<Database> {
    let db: Database;
    if (options.url) {
        const pool = new pg.Pool({ connectionString: options.url, max: 5 });
        db = {
            kind: 'postgres', query: (s, p) => pool.query(s, p), close: () => pool.end(), transaction: async (fn) => {
                const c = await pool.connect();
                try {
                    await c.query('BEGIN');
                    const r = await fn(c);
                    await c.query('COMMIT');
                    return r;
                }
                catch (e) {
                    await c.query('ROLLBACK');
                    throw e;
                }
                finally {
                    c.release();
                }
            }
        };
    }
    else {
        if (!options.preview)
            throw new Error('DATABASE_URL é obrigatório fora da prévia.');
        const dir = options.dataDir === ':memory:' ? 'memory://' : resolve(options.dataDir || '.data/preview');
        if (dir !== 'memory://')
            await mkdir(dir, { recursive: true });
        let release = async () => {
        };
        if (dir !== 'memory://') {
            const lock = resolve(dir, '.volta-lock');
            try {
                const handle = await open(lock, 'wx');
                await handle.writeFile(String(process.pid));
                await handle.close();
            }
            catch (error: any) {
                if (error.code === 'EEXIST')
                    throw new Error('Este banco de prévia já está aberto ou possui um bloqueio de encerramento anterior. Use outra DATA_DIR; consulte docs/OPERACAO.md.');
                throw error;
            }
            release = () => unlink(lock);
        }
        let embedded: PGlite;
        try {
            embedded = await PGlite.create(dir);
        }
        catch (e) {
            await release();
            throw e;
        }
        db = {
            kind: 'pglite-preview', query: (s, p) => embedded.query(s, p), close: async () => {
                try {
                    await embedded.close();
                }
                finally {
                    await release();
                }
            }, transaction: fn => embedded.transaction(tx => fn(tx))
        };
    }
    try {
        await db.query('CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now())');
        await db.transaction(async (tx) => {
            // One schema owner at a time, including when multiple API processes start.
            await tx.query('LOCK TABLE schema_migrations IN EXCLUSIVE MODE');
            const { rows } = await tx.query('SELECT version FROM schema_migrations WHERE version=1');
            if (!rows.length) {
                const sql = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
                for (const statement of sql.split(';').map(x => x.trim()).filter(Boolean))
                    await tx.query(statement);
            }
            if (!(await tx.query('SELECT version FROM schema_migrations WHERE version=2')).rows.length) {
                await tx.query("ALTER TABLE documents ADD COLUMN visibility text NOT NULL DEFAULT 'Restrito' CHECK(visibility IN ('Restrito','Equipe'))");
                await tx.query('ALTER TABLE documents DROP CONSTRAINT documents_file_name_hash_key');
                await tx.query('CREATE UNIQUE INDEX documents_owner_hash_idx ON documents(file_name,hash,author_id,visibility)');
                await tx.query('INSERT INTO schema_migrations(version) VALUES(2)');
            }
            for (const [id, name, interests] of MEMBERS)
                await tx.query('INSERT INTO members(id,name,interests) VALUES($1,$2,$3::jsonb) ON CONFLICT(id) DO NOTHING', [id, name, JSON.stringify(interests)]);
        });
        return db;
    }
    catch (e) {
        await db.close();
        throw e;
    }
}
