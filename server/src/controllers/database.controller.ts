/**
 * Експорт БД через mysqldump
 */

import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import type { Request, Response } from 'express';
import { dbConfig } from '../config/database.config';

/** Типові шляхи Homebrew: GUI/IDE часто запускають Node без PATH з shell, де є mysql-client. */
const MYSQLDUMP_CANDIDATES = [
    '/opt/homebrew/opt/mysql-client/bin/mysqldump',
    '/usr/local/opt/mysql-client/bin/mysqldump',
    '/opt/homebrew/bin/mysqldump',
    '/usr/local/bin/mysqldump'
];

function resolveMysqldumpPath(): string {
    const fromEnv = process.env.MYSQLDUMP_PATH?.trim();
    if (fromEnv) {
        return fromEnv;
    }
    for (const candidate of MYSQLDUMP_CANDIDATES) {
        try {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        } catch {
            /* ignore */
        }
    }
    return 'mysqldump';
}

function spawnEnvWithMysqlClientPath(): NodeJS.ProcessEnv {
    const extra = [
        '/opt/homebrew/opt/mysql-client/bin',
        '/usr/local/opt/mysql-client/bin',
        '/opt/homebrew/bin',
        '/usr/local/bin'
    ].join(':');
    const cur = process.env.PATH ?? '';
    return {
        ...process.env,
        PATH: `${extra}:${cur}`
    };
}

function timingSafeEqualString(a: string, b: string): boolean {
    try {
        const ba = Buffer.from(a, 'utf8');
        const bb = Buffer.from(b, 'utf8');
        if (ba.length !== bb.length) return false;
        return crypto.timingSafeEqual(ba, bb);
    } catch {
        return false;
    }
}

function buildDumpFilename(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `weaponry_full_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.sql`;
}

/**
 * GET /api/database/dump — потоковий SQL-дамп поточної бази (mysqldump).
 * Змінні: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME; опційно MYSQLDUMP_PATH, DUMP_SECRET.
 */
export function exportDatabaseDump(req: Request, res: Response): void {
    const secret = process.env.DUMP_SECRET;
    if (secret) {
        const header = req.get('x-dump-secret') || '';
        if (!timingSafeEqualString(header, secret)) {
            res.status(401).json({
                success: false,
                message: 'Потрібен коректний заголовок X-Dump-Secret (див. DUMP_SECRET на сервері)',
                error: 'DUMP_UNAUTHORIZED'
            });
            return;
        }
    }

    const mysqldumpPath = resolveMysqldumpPath();

    const args: string[] = [
        `-h${dbConfig.host}`,
        `-P${String(dbConfig.port)}`,
        `-u${dbConfig.user}`
    ];
    if (dbConfig.password) {
        args.push(`-p${dbConfig.password}`);
    }
    args.push(
        '--databases',
        dbConfig.database,
        '--add-drop-database',
        '--opt',
        '--hex-blob',
        '--routines',
        '--triggers',
        '--events',
        '--set-gtid-purged=OFF',
        '--single-transaction',
        '--no-tablespaces',
        '--comments'
    );

    const child = spawn(mysqldumpPath, args, {
        env: spawnEnvWithMysqlClientPath(),
        shell: false
    });

    let stderrAccum = '';
    child.stderr.on('data', (ch: Buffer) => {
        stderrAccum += ch.toString('utf8');
    });

    let headersSent = false;
    const sendHeaders = (): void => {
        if (headersSent) return;
        headersSent = true;
        res.setHeader('Content-Type', 'application/sql; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${buildDumpFilename()}"`);
    };

    req.on('close', () => {
        if (!child.killed) {
            child.kill('SIGTERM');
        }
    });

    child.stdout.on('data', (chunk: Buffer) => {
        sendHeaders();
        res.write(chunk);
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
        if (!headersSent) {
            res.status(500).json({
                success: false,
                message:
                    `Не вдалося запустити mysqldump (${mysqldumpPath}): ${err.message}. ` +
                    'Встановіть клієнт MySQL або задайте MYSQLDUMP_PATH до бінарника.',
                error: 'MYSQLDUMP_SPAWN_FAILED'
            });
        }
    });

    child.on('close', (code) => {
        if (res.headersSent) {
            if (code !== 0 && headersSent) {
                console.error('mysqldump помилка після початку відповіді:', stderrAccum || code);
            }
            if (!res.writableEnded) res.end();
            return;
        }
        if (code === 0) {
            if (!headersSent) sendHeaders();
            res.end();
            return;
        }
        res.status(500).json({
            success: false,
            message: stderrAccum.trim() || `mysqldump завершився з кодом ${code}`,
            error: 'MYSQLDUMP_FAILED'
        });
    });
}
