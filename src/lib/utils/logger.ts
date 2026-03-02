export function logHelloWorld(): void {
	console.log('Hello World from logger module!');
}

export function log(message: string): void {
	console.log(`[Logger] ${message}`);
}
