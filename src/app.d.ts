// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string;
				username: string;
				role: 'customer' | 'admin' | 'driver' | 'owner'; // Add this!
			} | null;
			session: import('lucia').Session | null;
		}		// interface PageData {}
		// interface Platform {}
	}
}

export {};
