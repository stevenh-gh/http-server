import net from 'node:net';

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
		console.log(this.request);
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
			let encoding = request.slice(encodingIndex);
			console.log('encodinggggg', encoding)
			if (!encoding.includes('invalid-encoding')) {
				if (encoding.includes('gzip')) {
					return 'gzip';
				}
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

export default Request;
