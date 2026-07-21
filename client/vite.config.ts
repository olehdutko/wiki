import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function getServerPort() {
    // 1. Explicit env variable from the dev launcher
    if (process.env.VITE_SERVER_PORT) {
        const port = parseInt(process.env.VITE_SERVER_PORT, 10)
        if (!Number.isNaN(port)) return port
    }

    // 2. Fallback to the port file written by scripts/start-server-dev.cjs
    const portFile = path.resolve(__dirname, '..', '.server-port')
    if (fs.existsSync(portFile)) {
        const port = parseInt(fs.readFileSync(portFile, 'utf8').trim(), 10)
        if (!Number.isNaN(port)) return port
    }

    // 3. Hardcoded fallback
    return 3001
}

const serverPort = getServerPort()

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Allow Vite to pick the next free port if 3000 is busy
        strictPort: false,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:' + serverPort,
                changeOrigin: true,
                secure: false
            },
            '/uploads': {
                target: 'http://localhost:' + serverPort,
                changeOrigin: true,
                secure: false
            }
        }
    }
})
