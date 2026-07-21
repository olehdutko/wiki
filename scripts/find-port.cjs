const net = require('net');

/**
 * Знаходить перший вільний TCP-порт, починаючи з startPort.
 * @param {number} startPort
 * @returns {Promise<number>}
 */
function findFreePort(startPort) {
    return new Promise((resolve, reject) => {
        const server = net.createServer();

        server.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve(findFreePort(startPort + 1));
            } else {
                reject(err);
            }
        });
    });
}

module.exports = { findFreePort };
