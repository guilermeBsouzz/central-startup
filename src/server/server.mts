import { openDatabase } from './database/client.mts';
import type { Database } from './database/client.mts';
import { buildApp } from './app.mts';
import { dailyReminders } from './jobs.mts';
const preview = process.argv.includes('--preview');
if (preview && process.env.NODE_ENV === 'production')
    throw new Error('Prévia não pode executar em NODE_ENV=production.');
const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT || 4175);
if (preview && !['127.0.0.1', '::1'].includes(host))
    throw new Error('Prévia só pode escutar em loopback.');
let db: Database | undefined;
let app: Awaited<ReturnType<typeof buildApp>> | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let stopping = false;
let shutdownPromise: Promise<void> | undefined;
let pending = false;
async function tick() {
    if (pending || stopping || !db || !app)
        return;
    pending = true;
    try {
        await dailyReminders(db);
    }
    catch (err) {
        app.log.error({ err }, 'Falha nos lembretes');
    }
    finally {
        pending = false;
    }
}
function shutdown(): Promise<void> {
    stopping = true;
    clearInterval(timer);
    return shutdownPromise ??= (async () => {
        // A signal may arrive while a resource is still being opened.
        await startup.catch(() => {});
        try {
            await app?.close();
        }
        finally {
            await db?.close();
        }
    })();
}
function onSignal() {
    void shutdown().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
const startup = (async () => {
    db = await openDatabase({ url: process.env.DATABASE_URL, dataDir: process.env.DATA_DIR, preview });
    if (stopping)
        return;
    app = await buildApp({
        db, preview, origin: process.env.PUBLIC_ORIGIN || `http://127.0.0.1:${port}`, logger: true
    });
    if (stopping)
        return;
    await app.listen({ host, port });
    if (stopping)
        return;
    await tick();
    if (stopping)
        return;
    timer = setInterval(tick, 60000);
    timer.unref();
})();
try {
    await startup;
}
catch (error) {
    await shutdown();
    throw error;
}
