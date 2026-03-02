// === LOGGING TEST #2: Instrumentation file ===
// This runs when the server starts up (before app code)
// See: https://svelte.dev/docs/kit/observability

console.log('[TEST 2] Hello World from instrumentation.server.ts!');
console.log('[TEST 2] Server instrumentation initialized');
console.log('[TEST 2] Process PID:', process.pid);

// This is where you would set up OpenTelemetry or other observability tools
// For now, we just confirm this file is being executed
export function setup() {
	console.log('[TEST 2] Instrumentation setup() function called!');
}

export function teardown() {
	console.log('[TEST 2] Instrumentation teardown() function called!');
}
