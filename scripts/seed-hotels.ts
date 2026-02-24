/**
 * Seed the hotel table from data/hotels.json.
 * Run: npx tsx scripts/seed-hotels.ts
 * Requires DATABASE_URL in .env (or environment).
 *
 * JSON format: array of { "name": string, "location": string }
 * "location" is the stage name (e.g. "Lagos", "Porto Covo") and is mapped to the stage id (LG, PC, etc.).
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { hotelTable } from '../src/lib/server/db/schema.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Maps location names (from Typeform dump or manual list) to trail stage IDs (see src/lib/trail.ts). */
const LOCATION_NAME_TO_ID: Record<string, string> = {
	'S. Torpes': 'ST',
	'São Torpes': 'ST',
	'Santiago do Cacém': 'ST',
	Sines: 'ST',
	'Vale Seco': 'ST',
	'Porto Covo': 'PC',
	'Cercal do Alentejo': 'PC',
	'Vila Nova de Milfontes': 'VM',
	Milfontes: 'VM',
	'S. Luís': 'VM',
	Longueira: 'VM',
	Almograve: 'AL',
	Cavaleiro: 'AL',
	'Zambujeira do Mar': 'ZM',
	Zambujeira: 'ZM',
	Odemira: 'OD',
	'S. Teotónio': 'OD',
	Brejão: 'OD',
	Odeceixe: 'OD',
	Rogil: 'AJ',
	Aljezur: 'AJ',
	'Arrifana (Vale da Telha)': 'AR',
	Arrifana: 'AR',
	Alfambras: 'CP',
	Bordeira: 'CP',
	Carrapateira: 'CP',
	Pedralva: 'VB',
	'Vila do Bispo': 'VB',
	Raposeira: 'SA',
	Sagres: 'SA',
	Salema: 'SL',
	Burgau: 'LZ',
	Luz: 'LZ',
	Lagos: 'LG'
};

type HotelRow = { name: string; location: string };

function main() {
	const dbUrl = process.env.DATABASE_URL;
	if (!dbUrl) {
		console.error('DATABASE_URL is required. Set it in .env or the environment.');
		process.exit(1);
	}

	const jsonPath = join(__dirname, '..', 'data', 'hotels.json');
	let raw: unknown;
	try {
		raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
	} catch (e) {
		console.error('Failed to read or parse data/hotels.json:', e);
		process.exit(1);
	}

	if (!Array.isArray(raw)) {
		console.error('data/hotels.json must be a JSON array.');
		process.exit(1);
	}

	const rows = raw as HotelRow[];
	const pool = new pg.Pool({ connectionString: dbUrl });
	const db = drizzle(pool);

	const toInsert: Array<{ id: string; locationId: string; name: string; contactInfo: string | null }> = [];
	for (const row of rows) {
		const name = typeof row.name === 'string' ? row.name.trim() : '';
		const locationName = typeof row.location === 'string' ? row.location.trim() : '';
		if (!name || !locationName) {
			console.warn('Skipping row with missing name or location:', row);
			continue;
		}
		const locationId = LOCATION_NAME_TO_ID[locationName];
		if (!locationId) {
			console.warn(`Unknown location "${locationName}" for hotel "${name}". Add it to LOCATION_NAME_TO_ID in scripts/seed-hotels.ts or use a stage id (e.g. LG, PC).`);
			continue;
		}
		toInsert.push({
			id: crypto.randomUUID(),
			locationId,
			name,
			contactInfo: null
		});
	}

	async function run() {
		for (const row of toInsert) {
			await db.insert(hotelTable).values(row);
		}
		console.log(`Inserted/updated ${toInsert.length} hotels.`);
		await pool.end();
	}

	run().catch((e) => {
		console.error(e);
		pool.end();
		process.exit(1);
	});
}

main();
