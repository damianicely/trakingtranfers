import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userTable, driverProfile } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { deleteUserCascade } from '$lib/server/delete-user';
import type { Actions, PageServerLoad } from './$types';
import crypto from 'node:crypto';
import { hash } from '@node-rs/argon2';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const allStaff: Array<{
		id: string;
		username: string;
		firstName: string | null;
		lastName: string | null;
		role: string;
		licenseNumber: string | null;
	}> = [];

	if (user.role === 'owner' || user.role === 'admin') {
		const staffUsers = await db
			.select()
			.from(userTable)
			.where(inArray(userTable.role, ['admin', 'driver']))
			.orderBy(userTable.username);
		const driverIds = staffUsers.filter((u) => u.role === 'driver').map((u) => u.id);
		const profiles =
			driverIds.length > 0
				? await db.select().from(driverProfile).where(inArray(driverProfile.userId, driverIds))
				: [];
		for (const u of staffUsers) {
			const profile = u.role === 'driver' ? profiles.find((p) => p.userId === u.id) : null;
			allStaff.push({
				id: u.id,
				username: u.username,
				firstName: u.firstName ?? null,
				lastName: u.lastName ?? null,
				role: u.role,
				licenseNumber: profile?.licenseNumber ?? null
			});
		}
	}

	return { user, allStaff };
};

export const actions: Actions = {
	createStaff: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const email = formData.get('username')?.toString()?.trim();
		const password = formData.get('password')?.toString();
		const firstName = formData.get('firstName')?.toString()?.trim();
		const lastName = formData.get('lastName')?.toString()?.trim();
		const role = formData.get('role')?.toString();
		const licenseNumber = formData.get('licenseNumber')?.toString()?.trim() || null;

		if (!email || email.length < 3) {
			return fail(400, { message: 'Email is required' });
		}
		if (!firstName?.trim()) {
			return fail(400, { message: 'First name is required' });
		}
		if (!lastName?.trim()) {
			return fail(400, { message: 'Last name is required' });
		}
		if (!password || password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters' });
		}
		if (role !== 'admin' && role !== 'driver') {
			return fail(400, { message: 'Role must be admin or driver' });
		}
		if (role === 'driver' && !licenseNumber) {
			return fail(400, { message: 'License number is required for drivers' });
		}

		const username = email.toLowerCase();
		const passwordHash = await hash(password, {
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});
		const userId = crypto.randomUUID();

		try {
			await db.insert(userTable).values({
				id: userId,
				username,
				passwordHash,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				role: role as 'admin' | 'driver'
			});
			if (role === 'driver' && licenseNumber) {
				await db.insert(driverProfile).values({
					userId,
					licenseNumber
				});
			}
		} catch (e: unknown) {
			const err = e as { code?: string };
			if (err?.code === '23505') {
				return fail(400, { message: 'Email already in use' });
			}
			throw e;
		}
		return { success: true, message: 'Team member added' };
	},

	removeStaff: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && locals.user.role !== 'admin')) {
			return fail(403, { message: 'Unauthorized' });
		}
		const formData = await request.formData();
		const staffId = formData.get('staffId')?.toString();
		if (!staffId) {
			return fail(400, { message: 'Staff ID is required' });
		}
		if (staffId === locals.user.id) {
			return fail(400, { message: 'You cannot remove yourself' });
		}
		const [staff] = await db.select().from(userTable).where(eq(userTable.id, staffId));
		if (!staff || (staff.role !== 'admin' && staff.role !== 'driver')) {
			return fail(400, { message: 'User is not a team member' });
		}
		await deleteUserCascade(staffId);
		return { success: true, message: 'Team member removed' };
	}
};
