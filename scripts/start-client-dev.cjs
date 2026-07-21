const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT_FILE = path.resolve(__dirname, '..', '.server-port');
const MAX_WAIT_MS = 30000;
const CHECK_INTERVAL_MS = 100;

function waitForServerPort() {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (fs.existsSync(PORT_FILE)) {
                const port = parseInt(fs.readFileSync(PORT_FILE, 'utf8').trim(), 10);
                if (!Number.isNaN(port)) {
                    resolve(port);
                    return;
                }
            }
            if (Date.now() - start > MAX_WAIT_MS) {
                reject(new Error('Timed out waiting for .server-port file'));
                return;
            }
            setTimeout(check, CHECK_INTERVAL_MS);
        };
        check();
    });
}

(async () => {
    const serverPort = await waitForServerPort();
    console.log('[dev] Client proxy target: http://localhost:' + serverPort);

    const vite = spawn('npx', ['vite'], {
        cwd: path.resolve(__dirname, '..', 'client'),
        stdio: 'inherit',
        env: { ...process.env, VITE_SERVER_PORT: String(serverPort) },
        shell: true
    });

    vite.on('exit', (code) => {
        process.exit(code ?? 0);
    });
})();
