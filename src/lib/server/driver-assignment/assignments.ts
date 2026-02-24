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

/** List all assignments for a given date. Returns map from "fromStageId-toStageId" to driverId. */
export async function getAssignmentsForDate(dateStr: string): Promise<Record<string, string>> {
	const rows = await db
		.select({
			fromStageId: driverStepAssignmentTable.fromStageId,
			toStageId: driverStepAssignmentTable.toStageId,
			driverId: driverStepAssignmentTable.driverId
		})
		.from(driverStepAssignmentTable)
		.where(eq(driverStepAssignmentTable.date, dateStr));

	const map: Record<string, string> = {};
	for (const row of rows) {
		const key = `${row.fromStageId}-${row.toStageId}`;
		map[key] = row.driverId;
	}
	return map;
}

/** Set or update assignment for (date, fromStageId, toStageId) to driverId. */
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
				eq(driverStepAssignmentTable.toStageId, toStageId)
			)
		)
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(driverStepAssignmentTable)
			.set({ driverId })
			.where(eq(driverStepAssignmentTable.id, existing[0]!.id));
	} else {
		await db.insert(driverStepAssignmentTable).values({
			id: crypto.randomUUID(),
			date: dateStr,
			fromStageId,
			toStageId,
			driverId
		});
	}
}

/** Remove assignment for (date, fromStageId, toStageId). */
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
