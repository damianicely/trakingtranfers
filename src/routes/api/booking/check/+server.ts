import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkEmailExists, checkDailyCapacity } from '$lib/server/booking/checks';

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientId(request: Request): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0]?.trim() ?? 'unknown';
	}
	const via = request.headers.get('x-real-ip');
	if (via) return via;
	return 'unknown';
}

function isRateLimited(clientId: string): boolean {
	const now = Date.now();
	const entry = rateLimitMap.get(clientId);
	if (!entry) {
		rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}
	if (now >= entry.resetAt) {
		rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		return false;
	}
	entry.count += 1;
	return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

function isValidEmail(s: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

function isValidDateStr(s: string): boolean {
	if (!s || typeof s !== 'string') return false;
	const d = new Date(s);
	return !isNaN(d.getTime());
}

function isValidRoute(route: unknown): route is [string, string][] {
	if (!Array.isArray(route)) return false;
	return route.every(
		(seg) => Array.isArray(seg) && seg.length === 2 && typeof seg[0] === 'string' && typeof seg[1] === 'string'
	);
}

export const POST: RequestHandler = async ({ request }) => {
	const clientId = getClientId(request);
	if (isRateLimited(clientId)) {
		return json({ ok: false, message: 'Too many requests. Please try again later.' }, { status: 429 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
	}

	if (body === null || typeof body !== 'object' || !('type' in body)) {
		return json({ ok: false, message: 'Invalid request. Missing type.' }, { status: 400 });
	}

	const type = (body as { type?: string }).type;
	if (type === 'email') {
		const email = (body as { email?: string }).email;
		if (typeof email !== 'string' || !email.trim()) {
			return json({ ok: false, message: 'Email is required.' }, { status: 400 });
		}
		if (!isValidEmail(email)) {
			return json({ ok: false, message: 'Please enter a valid email address.' }, { status: 400 });
		}
		const result = await checkEmailExists(email);
		return json(result);
	}

	if (type === 'availability') {
		const departureDate = (body as { departureDate?: string }).departureDate;
		const route = (body as { route?: unknown }).route;
		if (typeof departureDate !== 'string' || !departureDate.trim()) {
			return json({ ok: false, message: 'Departure date is required.' }, { status: 400 });
		}
		if (!isValidDateStr(departureDate)) {
			return json({ ok: false, message: 'Invalid date.' }, { status: 400 });
		}
		if (!isValidRoute(route)) {
			return json({ ok: false, message: 'Invalid route.' }, { status: 400 });
		}
		const result = await checkDailyCapacity(departureDate, route);
		return json(result);
	}

	return json({ ok: false, message: 'Unknown check type.' }, { status: 400 });
};
