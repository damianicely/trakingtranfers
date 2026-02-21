/**
 * Shared price calculation for booking (route length + bags).
 * Used by BookingForm (Pay Now) and optionally Payment.svelte.
 */
export function calculateBookingPrice(
	route: [string, string][] | null,
	bags: string | number | undefined
): number | null {
	if (!route || route.length === 0) return null;
	const bagsStr = bags != null ? String(bags).trim() : '';
	if (!bagsStr || bagsStr === '0') return null;
	const numTransfers = route.length;
	const numBags = parseInt(bagsStr, 10);
	if (!numBags || numBags <= 0 || isNaN(numBags)) return null;

	const pricePerTransfer = numTransfers >= 4 ? 15 : 20;
	const baseCost = numTransfers * pricePerTransfer;
	const additionalBags = Math.max(0, numBags - 2);
	const additionalBagsCost = numTransfers * additionalBags * 5;
	return baseCost + additionalBagsCost;
}
