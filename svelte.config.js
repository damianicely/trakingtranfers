import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		experimental: {
			instrumentation: {
				server: true
			}
		}
	},

	onwarn: (warning, handler) => {
		const { code, message } = warning;
		if (code?.includes('css') || code?.includes('a11y') || message?.includes('Unused CSS')) {
			return;
		}
		handler(warning);
	}
};

export default config;
