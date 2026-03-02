import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

console.log('Hello World - Server starting!');

export default defineConfig({
	plugins: [sveltekit()]
});
