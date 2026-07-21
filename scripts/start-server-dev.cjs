const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findFreePort } = require('./find-port.cjs');

const PORT_FILE = path.resolve(__dirname, '..', '.server-port');

(async () => {
    const preferredPort = parseInt(process.env.PREFERRED_SERVER_PORT || '3001', 10);
    const port = await findFreePort(preferredPort);

    fs.writeFileSync(PORT_FILE, String(port), 'utf8');
    console.log('[dev] Server will use port ' + port);

    const env = { ...process.env, PORT: String(port) };
    const nodemon = spawn('npx', ['nodemon', 'server/src/index.ts'], {
        cwd: path.resolve(__dirname, '..'),
        stdio: 'inherit',
        env,
        shell: true
    });

    nodemon.on('exit', (code) => {
        process.exit(code ?? 0);
    });
})();
