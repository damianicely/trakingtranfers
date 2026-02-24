// src/lib/delivery-steps.ts
// Delivery steps = trail segments (fromStageId, toStageId). Direction implied by order.

import { getSegments, STAGES } from './trail.js';

export type StepKey = [fromStageId: string, toStageId: string];

/** All 26 delivery steps: 13 NS (S. Torpes → Lagos) then 13 SN (Lagos → S. Torpes). */
export function getAllDeliverySteps(): StepKey[] {
	const ns = getSegments('NS');
	const sn = getSegments('SN');
	return [...ns, ...sn];
}

/** Human-readable label for a step (e.g. "ST → PC"). */
export function getStepLabel(fromStageId: string, toStageId: string): string {
	const fromName = STAGES.find((s) => s.id === fromStageId)?.name ?? fromStageId;
	const toName = STAGES.find((s) => s.id === toStageId)?.name ?? toStageId;
	return `${fromName} → ${toName}`;
}

/** Short label using stage IDs (e.g. "ST → PC"). */
export function getStepShortLabel(fromStageId: string, toStageId: string): string {
	return `${fromStageId} → ${toStageId}`;
}
