import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { deleteUserCascade } from '$lib/server/delete-user';

function canPerformAdminActions(user: { role: string } | null): boolean {
	return !!user && (user.role === 'admin' || user.role === 'owner');
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	let customers: Array<{ id: string; username: string; role: string }> = [];

	if (user.role === 'admin' || user.role === 'owner') {
		customers = await db
			.select()
			.from(userTable)
			.where(eq(userTable.role, 'customer'))
			.orderBy(userTable.username);
	}

	return { user, customers };
};

export const actions: Actions = {
	updateCustomer: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const customerId = formData.get('customerId')?.toString();
		const username = formData.get('username')?.toString();

		if (!customerId || !username) {
			return fail(400, { message: 'Customer ID and username are required' });
		}

		await db
			.update(userTable)
			.set({ username })
			.where(eq(userTable.id, customerId));

		return { success: true, message: 'Customer updated successfully' };
	},

	deleteCustomer: async ({ request, locals }) => {
		if (!canPerformAdminActions(locals.user)) {
			return fail(403, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const customerId = formData.get('customerId')?.toString();

		if (!customerId) {
			return fail(400, { message: 'Customer ID is required' });
		}

		await deleteUserCascade(customerId);

		return { success: true, message: 'Customer deleted successfully' };
	}
};

