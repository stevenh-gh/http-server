import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';

interface RequestType {
    getMethod(): string;
    getPath(): string;
    getPathContents(): string[];
    getAcceptEncoding(): string | undefined;
    getUserAgent(): string | undefined;
    getContentLength(): number,
    getContent(): string[]
}

class Request implements RequestType {
    private request: string[];
    private method: string;
    private path: string;
    private acceptEncoding: string | undefined;
    private userAgent: string | undefined;
    private contentLength: number
    private content: string[];

    public constructor(buffer: net.Buffer | string) {
        this.request = buffer.toString().split(' ').map((str: string) => str.split('\r\n')).flat().filter((str: string) => str.length);
        this.method = this.processMethod(this.request);
        this.path = this.processPath(this.request);
        this.acceptEncoding = this.processAcceptEncoding(this.request);
        this.userAgent = this.processUserAgent(this.request);
        this.processContent(this.request);
    }


    public getMethod(): string {
        return this.method;
    }

    public getPath(): string {
        return this.path;
    }

    public getPathContents(): string[] {
        return this.path.split('/').slice(1);
    }

    public getAcceptEncoding(): string | undefined {
        return this.acceptEncoding;
    }

    public getUserAgent(): string | undefined {
        return this.userAgent;
    }

    public getContentLength(): number {
        return this.contentLength;
    }

    public getContent(): string[] {
        return this.content;
    }

    public processMethod(request: string[]): string {
        return request[0].toLowerCase();
    }

    private processPath(request: string[]): string {
        return request[1];
    }

    private processAcceptEncoding(request: string[]): string | undefined {
        let encodingIndex: number = request.findIndex((e: string) => e.toLowerCase() === 'accept-encoding:') + 1;
        if (encodingIndex !== -1) {
            let encoding = request.at(encodingIndex);
            if (encoding !== 'invalid-encoding') {
                return encoding;
            }
        }
        return undefined;
    }

    private processUserAgent(request: string[]): string | undefined {
        let agentIndex: number = request.findIndex((e: string) => e.toLowerCase() === 'user-agent:') + 1;
        if (agentIndex !== -1) {
            let agent = request.at(agentIndex);
            return agent;
        }
        return undefined;
    }

    private processContent(request: string[]): void {
        let contentLengthIndex: number = request.findIndex((e: string) => e.toLowerCase() === 'content-length:');
        if (contentLengthIndex !== -1) {
            this.contentLength = request.at(contentLengthIndex + 1);
            this.content = request.slice(contentLengthIndex + 2)
        }
    }
}

const server: net.Server = net.createServer((socket: net.socket) => {
    // socket.write('HTTP/1.1 200 OK\r\n\r\n');
    // socket.end();
    socket.on('data', (buffer: net.Buffer | string) => {
        // let request: string[] = buffer.toString().split(' ').map((str: string) => str.split('\r\n')).flat().filter((str: string) => str.length);
        // console.log(request);
        // let method: string = request[0].toLowerCase();
        // let path: string = request[1];
        const request: Request = new Request(buffer);
        let pathContents: string[] = request.getPathContents();
        if (request.getMethod() === 'get') {
            if (request.getPath() === '/') {
                socket.write('HTTP/1.1 200 OK\r\n\r\n');
            } else {
                if (pathContents[0] === 'echo') {
                    let encoding = request.getAcceptEncoding();
                    if (encoding) {
                        socket.write(`HTTP/1.1 200 OK\r\nContent-Encoding: ${encoding}\r\nContent-Type: text/plain\r\nContent-Length: ${pathContents[1].length}\r\n\r\n${pathContents[1]}`);
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
                fs.writeFile(directory + fileName, request.getContent().slice(7).join(' '), (err: Error) => {
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
