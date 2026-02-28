import { redirect } from '@sveltejs/kit';

/** Customer account landing: redirect to dashboard. */
export function load() {
	throw redirect(302, '/dashboard');
}
