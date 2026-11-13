import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = resolve('test-results/server-lifecycle');

async function fixture(fn) {
    await mkdir(root, { recursive: true });
    const dir = await mkdtemp(resolve(root, 'preview-'));
    const occupied = createServer();
    await new Promise((resolve, reject) => {
        occupied.once('error', reject);
        occupied.listen(0, '127.0.0.1', resolve);
    });
    try {
        await fn(dir, occupied.address().port);
    }
    finally {
        await new Promise(resolve => occupied.close(resolve));
        assert.ok(resolve(dir).startsWith(root + sep));
        await rm(dir, { recursive: true, force: true });
    }
}

function preview(dir, port, interruptStartup = false) {
    const env = { ...process.env, DATA_DIR: dir, PORT: String(port), HOST: '127.0.0.1', NODE_ENV: 'test' };
    delete env.DATABASE_URL;
    delete env.PUBLIC_ORIGIN;
    const args = interruptStartup ? ['--input-type=module', '--eval', `
        process.on('message', () => {
            process.emit('SIGINT');
            process.emit('SIGTERM');
            process.disconnect();
        });
        await import('./server.cjs');
    `, '--', '--preview'] : ['server.cjs', '--preview'];
    const child = spawn(process.execPath, args, {
        env, timeout: 30000,
        stdio: interruptStartup ? ['ignore', 'pipe', 'pipe', 'ipc'] : ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { output += data; });
    const done = new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ code, signal, output }));
    });
    return { child, done };
}

test('a failed listen releases the preview lock and allows another startup', async () => {
    await fixture(async (dir, port) => {
        for (let attempt = 0; attempt < 2; attempt++) {
            const result = await preview(dir, port).done;
            assert.equal(result.signal, null, result.output);
            assert.equal(result.code, 1, result.output);
            assert.match(result.output, /EADDRINUSE/);
            await assert.rejects(access(resolve(dir, '.volta-lock')), { code: 'ENOENT' });
        }
    });
});

test('signals during database startup share cleanup and prevent listen', async () => {
    await fixture(async (dir, port) => {
        const running = preview(dir, port, true);
        try {
            const deadline = Date.now() + 20000;
            while (true) {
                try {
                    await access(resolve(dir, '.volta-lock'));
                    break;
                }
                catch (error) {
                    if (running.child.exitCode !== null || running.child.signalCode !== null) {
                        const result = await running.done;
                        assert.fail(`Preview exited before creating its lock: ${result.output}`);
                    }
                    if (error.code !== 'ENOENT' || Date.now() >= deadline)
                        throw error;
                    await delay(20);
                }
            }
            running.child.send('stop');
            const result = await running.done;
            assert.equal(result.signal, null, result.output);
            assert.equal(result.code, 0, result.output);
            assert.doesNotMatch(result.output, /EADDRINUSE/);
            await assert.rejects(access(resolve(dir, '.volta-lock')), { code: 'ENOENT' });
        }
        finally {
            if (running.child.exitCode === null && running.child.signalCode === null)
                running.child.kill();
            await running.done;
        }
    });
});
