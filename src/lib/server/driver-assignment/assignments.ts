import { db } from '$lib/server/db';
import { driverStepAssignmentTable } from '$lib/server/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import crypto from 'node:crypto';

export type AssignmentRow = {
	date: string;
	fromStageId: string;
	toStageId: string;
	driverId: string;
};

/** List all assignments for a given date. Returns map from "fromStageId-toStageId" to driverIds[]. */
export async function getAssignmentsForDate(dateStr: string): Promise<Record<string, string[]>> {
	const rows = await db
		.select({
			fromStageId: driverStepAssignmentTable.fromStageId,
			toStageId: driverStepAssignmentTable.toStageId,
			driverId: driverStepAssignmentTable.driverId
		})
		.from(driverStepAssignmentTable)
		.where(eq(driverStepAssignmentTable.date, dateStr));

	const map: Record<string, string[]> = {};
	for (const row of rows) {
		const key = `${row.fromStageId}-${row.toStageId}`;
		if (!map[key]) map[key] = [];
		map[key].push(row.driverId);
	}
	return map;
}

/** Add driver to leg (idempotent). Multiple drivers can be assigned to the same leg. */
export async function setAssignment(
	dateStr: string,
	fromStageId: string,
	toStageId: string,
	driverId: string
): Promise<void> {
	const existing = await db
		.select({ id: driverStepAssignmentTable.id })
		.from(driverStepAssignmentTable)
		.where(
			and(
				eq(driverStepAssignmentTable.date, dateStr),
				eq(driverStepAssignmentTable.fromStageId, fromStageId),
				eq(driverStepAssignmentTable.toStageId, toStageId),
				eq(driverStepAssignmentTable.driverId, driverId)
			)
		)
		.limit(1);

	if (existing.length === 0) {
		await db.insert(driverStepAssignmentTable).values({
			id: crypto.randomUUID(),
			date: dateStr,
			fromStageId,
			toStageId,
			driverId
		});
	}
}

/** Remove one driver from a leg. */
export async function removeAssignment(
	dateStr: string,
	fromStageId: string,
	toStageId: string,
	driverId: string
): Promise<void> {
	await db
		.delete(driverStepAssignmentTable)
		.where(
			and(
				eq(driverStepAssignmentTable.date, dateStr),
				eq(driverStepAssignmentTable.fromStageId, fromStageId),
				eq(driverStepAssignmentTable.toStageId, toStageId),
				eq(driverStepAssignmentTable.driverId, driverId)
			)
		);
}

/** Remove all driver assignments for a leg. */
export async function clearAssignment(
	dateStr: string,
	fromStageId: string,
	toStageId: string
): Promise<void> {
	await db
		.delete(driverStepAssignmentTable)
		.where(
			and(
				eq(driverStepAssignmentTable.date, dateStr),
				eq(driverStepAssignmentTable.fromStageId, fromStageId),
				eq(driverStepAssignmentTable.toStageId, toStageId)
			)
		);
}

export type DriverAssignmentEntry = {
	date: string;
	fromStageId: string;
	toStageId: string;
};

/** List all assignments for a driver in a date range. */
export async function getAssignmentsForDriver(
	driverId: string,
	startDateStr: string,
	endDateStr: string
): Promise<DriverAssignmentEntry[]> {
	const rows = await db
		.select({
			date: driverStepAssignmentTable.date,
			fromStageId: driverStepAssignmentTable.fromStageId,
			toStageId: driverStepAssignmentTable.toStageId
		})
		.from(driverStepAssignmentTable)
		.where(
			and(
				eq(driverStepAssignmentTable.driverId, driverId),
				gte(driverStepAssignmentTable.date, startDateStr),
				lte(driverStepAssignmentTable.date, endDateStr)
			)
		);

	return rows.map((r: { date: string; fromStageId: string; toStageId: string }) => ({
		date: r.date,
		fromStageId: r.fromStageId,
		toStageId: r.toStageId
	}));
}
