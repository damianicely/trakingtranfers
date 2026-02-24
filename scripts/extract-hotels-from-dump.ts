/**
 * Extract hotel name + location from data/temporaryhoteldump.json (Typeform export)
 * and write data/hotels.json. Run: npx tsx scripts/extract-hotels-from-dump.ts
 *
 * Expects dump to have "form: { ... }" with fields that have choices[].label like "Location | Hotel Name".
 * Output: array of { "location": string, "name": string } for the 14 Fisherman's Trail locations only.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** 14 stage IDs on the Fisherman's Trail (see src/lib/trail.ts). */
const FISHERMANS_TRAIL_IDS = new Set([
	'ST', 'PC', 'VM', 'AL', 'ZM', 'OD', 'AJ', 'AR', 'CP', 'VB', 'SA', 'SL', 'LZ', 'LG'
]);

/** Location names from dump → stage id. Only names that map to a trail stage are allowed. */
const LOCATION_NAME_TO_ID: Record<string, string> = {
	'S. Torpes': 'ST', 'São Torpes': 'ST', 'Santiago do Cacém': 'ST', Sines: 'ST', 'Vale Seco': 'ST',
	'Porto Covo': 'PC', 'Cercal do Alentejo': 'PC',
	'Vila Nova de Milfontes': 'VM', Milfontes: 'VM', 'S. Luís': 'VM', Longueira: 'VM',
	Almograve: 'AL', Cavaleiro: 'AL',
	'Zambujeira do Mar': 'ZM', Zambujeira: 'ZM',
	Odemira: 'OD', 'S. Teotónio': 'OD', Brejão: 'OD', Odeceixe: 'OD',
	Rogil: 'AJ', Aljezur: 'AJ',
	'Arrifana (Vale da Telha)': 'AR', Arrifana: 'AR',
	Alfambras: 'CP', Bordeira: 'CP', Carrapateira: 'CP',
	Pedralva: 'VB', 'Vila do Bispo': 'VB', Raposeira: 'SA', Sagres: 'SA',
	Salema: 'SL', Burgau: 'LZ', Luz: 'LZ', Lagos: 'LG'
};

const ALLOWED_LOCATIONS = new Set(
	Object.keys(LOCATION_NAME_TO_ID).filter((name) => FISHERMANS_TRAIL_IDS.has(LOCATION_NAME_TO_ID[name]))
);

const SKIP_LABELS = new Set(['No Booking', 'Other']);
const SKIP_PREFIX = '! ';

function extractLabels(obj: unknown): string[] {
	const labels: string[] = [];
	if (!obj || typeof obj !== 'object') return labels;
	const o = obj as Record<string, unknown>;

	if (Array.isArray(o.choices)) {
		for (const c of o.choices as Array<{ label?: string }>) {
			if (typeof c?.label === 'string') labels.push(c.label);
		}
	}
	if (Array.isArray(o.fields)) {
		for (const f of o.fields as Record<string, unknown>[]) {
			labels.push(...extractLabels(f));
			const props = f?.properties as Record<string, unknown> | undefined;
			if (props && typeof props === 'object') {
				labels.push(...extractLabels(props.fields));
				// Typeform often puts choices under field.properties.choices
				labels.push(...extractLabels({ choices: props.choices }));
			}
		}
	}
	return labels;
}

function main() {
	const dumpPath = join(__dirname, '..', 'data', 'temporaryhoteldump.json');
	let raw: string;
	try {
		raw = readFileSync(dumpPath, 'utf-8');
	} catch (e) {
		console.error('Failed to read data/temporaryhoteldump.json:', e);
		process.exit(1);
	}

	raw = raw.trim();
	if (raw.startsWith('form:')) {
		raw = raw.slice(5).trim();
	}
	// Dump may contain extra text after the first JSON object; parse only the first object.
	const firstBrace = raw.indexOf('{');
	if (firstBrace === -1) {
		console.error('No JSON object found in dump.');
		process.exit(1);
	}
	let depth = 0;
	let end = -1;
	const inString = (s: string, i: number, quote: string) => {
		let j = i;
		while (j < s.length) {
			if (s[j] === '\\') {
				j += 2;
				continue;
			}
			if (s[j] === quote) return j;
			j++;
		}
		return -1;
	};
	for (let i = firstBrace; i < raw.length; i++) {
		const c = raw[i];
		if (c === '"' || c === "'") {
			const close = inString(raw, i + 1, c);
			if (close === -1) break;
			i = close;
			continue;
		}
		if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) {
				end = i;
				break;
			}
		}
	}
	const jsonStr = end === -1 ? raw : raw.slice(firstBrace, end + 1);
	let data: unknown;
	try {
		data = JSON.parse(jsonStr);
	} catch (e) {
		console.error('Failed to parse JSON:', e);
		process.exit(1);
	}

	const allLabels = extractLabels(data);
	const seen = new Set<string>();
	const hotels: Array<{ location: string; name: string }> = [];

	for (const label of allLabels) {
		if (label.startsWith(SKIP_PREFIX)) continue;
		const i = label.indexOf(' | ');
		if (i === -1) continue;
		const location = label.slice(0, i).trim();
		const name = label.slice(i + 3).trim();
		if (SKIP_LABELS.has(name)) continue;
		if (!ALLOWED_LOCATIONS.has(location)) continue;
		const key = `${location}\t${name}`;
		if (seen.has(key)) continue;
		seen.add(key);
		hotels.push({ location, name });
	}

	hotels.sort((a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name));
	const outPath = join(__dirname, '..', 'data', 'hotels.json');
	writeFileSync(outPath, JSON.stringify(hotels, null, 2), 'utf-8');
	console.log(`Wrote ${hotels.length} hotels to data/hotels.json`);
}

main();
