import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Language } from '$lib/translations';

function createLanguageStore() {
	const { subscribe, set, update } = writable<Language>('en');

	return {
		subscribe,
		init: () => {
			if (browser) {
				const saved = localStorage.getItem('language') as Language;
				if (saved === 'en' || saved === 'pt') {
					set(saved);
				}
			}
		},
		toggle: () => {
			update((lang) => {
				const newLang = lang === 'en' ? 'pt' : 'en';
				if (browser) {
					localStorage.setItem('language', newLang);
				}
				return newLang;
			});
		}
	};
}

export const language = createLanguageStore();
