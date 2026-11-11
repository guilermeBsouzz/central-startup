import { openDatabase } from '../../src/server/database/client.mts';
import { snapshot, restoreEmpty } from '../../src/server/database/backup.mts';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const [operation, file] = process.argv.slice(2);
if (!['export', 'restore-empty'].includes(operation) || !file)
    throw new Error('Uso: npm run backup -- export|restore-empty CAMINHO. Na prévia, pare o servidor primeiro.');
const db = await openDatabase({ url: process.env.DATABASE_URL, dataDir: process.env.DATA_DIR, preview: !process.env.DATABASE_URL });
try {
    if (operation === 'export') {
        const target = resolve(file);
        await mkdir(resolve(target, '..'), { recursive: true });
        await writeFile(target, await snapshot(db), { flag: 'wx', mode: 0o600 });
        console.log('Backup criado. Guarde em local privado.');
    }
    else {
        await restoreEmpty(db, await readFile(resolve(file), 'utf8'));
        console.log('Backup restaurado em banco vazio; sessões não foram restauradas.');
    }
}
finally {
    await db.close();
}
