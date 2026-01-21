import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validatePasswordResetToken, updateUserPassword } from '$lib/server/auth/password-reset';

export const load: PageServerLoad = async ({ params }) => {
	const token = params.token;

	if (!token) {
		return {
			tokenValid: false
		};
	}

	const validation = await validatePasswordResetToken(token);

	return {
		tokenValid: validation.valid
	};
};

export const actions: Actions = {
	default: async ({ request, params }) => {
		const token = params.token;

		if (!token) {
			return fail(400, { message: 'Invalid or missing token' });
		}

		const formData = await request.formData();
		const password = formData.get('password');
		const confirmPassword = formData.get('confirmPassword');

		if (typeof password !== 'string') {
			return fail(400, { message: 'Password is required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match' });
		}

		// Validate the token
		const validation = await validatePasswordResetToken(token);

		if (!validation.valid || !validation.userId) {
			return fail(400, { message: validation.error || 'This link is invalid or has expired' });
		}

		// Update the user's password
		const result = await updateUserPassword(validation.userId, password);

		if (!result.success) {
			return fail(400, { message: result.error || 'Failed to update password' });
		}

		// Redirect to login page
		throw redirect(302, '/login');
	}
};

