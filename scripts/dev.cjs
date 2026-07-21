const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");

const PORT_FILE = path.resolve(__dirname, "..", ".server-port");
const MAX_WAIT_MS = 30000;
const CHECK_INTERVAL_MS = 100;

function cleanup() {
    try {
        if (fs.existsSync(PORT_FILE)) {
            fs.unlinkSync(PORT_FILE);
        }
    } catch {
        // ignore
    }
}

function waitForServerPort() {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            if (fs.existsSync(PORT_FILE)) {
                const port = parseInt(fs.readFileSync(PORT_FILE, "utf8").trim(), 10);
                if (!Number.isNaN(port)) {
                    const socket = new net.Socket();
                    socket.setTimeout(500);
                    socket.once("connect", () => {
                        socket.destroy();
                        resolve(port);
                    });
                    socket.once("error", () => {
                        socket.destroy();
                        retry();
                    });
                    socket.once("timeout", () => {
                        socket.destroy();
                        retry();
                    });
                    socket.connect(port, "127.0.0.1");
                    return;
                }
            }
            retry();

            function retry() {
                if (Date.now() - start > MAX_WAIT_MS) {
                    reject(new Error("Timed out waiting for dev server port"));
                    return;
                }
                setTimeout(check, CHECK_INTERVAL_MS);
            }
        };
        check();
    });
}

process.on("exit", cleanup);

const server = spawn("node", [path.resolve(__dirname, "start-server-dev.cjs")], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit"
});

let client;

server.on("error", (err) => {
    console.error("[dev] Server launcher error:", err);
    cleanup();
    process.exit(1);
});

server.on("exit", (code) => {
    if (code !== 0) {
        console.error(`[dev] Server launcher exited with code ${code}`);
    }
    if (client) {
        client.kill("SIGTERM");
    }
    cleanup();
    process.exit(code ?? 0);
});

(async () => {
    try {
        const serverPort = await waitForServerPort();
        console.log(`[dev] Server ready on port ${serverPort}, starting client...`);

        client = spawn("node", [path.resolve(__dirname, "start-client-dev.cjs")], {
            cwd: path.resolve(__dirname, ".."),
            stdio: "inherit",
            env: { ...process.env, VITE_SERVER_PORT: String(serverPort) }
        });

        client.on("exit", (code) => {
            console.log(`[dev] Client exited with code ${code}`);
            server.kill("SIGTERM");
            cleanup();
            process.exit(code ?? 0);
        });
    } catch (err) {
        console.error("[dev] Failed to start client:", err.message);
        server.kill("SIGTERM");
        cleanup();
        process.exit(1);
    }
})();

function shutdown() {
    server.kill("SIGTERM");
    if (client) client.kill("SIGTERM");
    cleanup();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
