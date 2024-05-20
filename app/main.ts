import Request from './request';
import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';
import zlib from 'node:zlib';

// let test = zlib.gzipSync('foo');
// console.log('zlib test', test.toString('hex'))

const server: net.Server = net.createServer((socket: net.socket) => {
    socket.on('data', (buffer: net.Buffer | string) => {
        const request: Request = new Request(buffer);
        let pathContents: string[] = request.getPathContents();
        if (request.getMethod() === 'get') {
            if (request.getPath() === '/') {
                socket.write('HTTP/1.1 200 OK\r\n\r\n');
            } else {
                if (pathContents[0] === 'echo') {
                    let encoding = request.getAcceptEncoding();
                    console.log(encoding)
                    if (encoding) {
                        let compress = zlib.gzipSync(pathContents[1]).toString('hex');
                        // console.log(`HTTP/1.1 200 OK\r\nContent-Encoding: ${encoding}\r\nContent-Type: text/plain\r\nContent-Length: ${compress.length}\r\n\r\n\r\n${compress}`);
                        socket.write(`HTTP/1.1 200 OK\r\nContent-Encoding: ${encoding}\r\nContent-Type: text/plain\r\nContent-Length: ${compress.length}\r\n\r\n\r\n\r\n${compress}`);
                    }
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${pathContents[1].length}\r\n\r\n${pathContents[1]}`);

                } else if (pathContents[0] === 'user-agent') {
                    let userAgent: string | undefined = request.getUserAgent();
                    socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${userAgent!.length}\r\n\r\n${userAgent}`);
                } else if (pathContents[0] === 'files') {
                    let directory: string = process.argv[3];
                    let fileName: string = pathContents[1]
                    fs.readFile(directory + fileName, 'utf8', (err: Error, data: string) => {
                        if (err) {
                            socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                        }
                        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${data.length}\r\n\r\n${data}`);
                    })
                } else {
                    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                }
            }
        }
        if (request.getMethod() === 'post') {
            if (pathContents[0] === 'files') {
                let directory: string = process.argv[3];
                let fileName: string = pathContents[1]
                fs.writeFile(directory + fileName, request.getContent().join(' '), (err: Error) => {
                    if (err) {
                        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                    } else {
                        socket.write('HTTP/1.1 201 Created\r\n\r\n');
                    }
                })
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
