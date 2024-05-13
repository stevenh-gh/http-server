import * as net from 'net';

const server: net.Server = net.createServer((socket: net.socket) => {
    // socket.write('HTTP/1.1 200 OK\r\n\r\n');
    // socket.end();
    socket.on('data', (buffer: net.Buffer | string) => {
        let request: string[] = buffer.toString().split(' ');
        let path: string = request[1];
        if (path === '/') {
            socket.write('HTTP/1.1 200 OK\r\n\r\n');
        } else {
            let pathContents: string[] = path.split('/');
            pathContents.shift();
            if (pathContents[0] === 'echo') {
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${pathContents[1].length}\r\n\r\n${pathContents[1]}`);
            } else if (pathContents[0] === 'user-agent') {
                let userAgent: string = request.at(-1).trim();
                socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent.length}\r\n\r\n${userAgent}`);
            }
            else {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
            }
        }
    })
});

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!");

// Uncomment this to pass the first stage
server.listen(4221, 'localhost', () => {
    console.log('Server is running on port 4221');
});
