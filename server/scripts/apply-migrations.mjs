/**
 * Apply ordered SQL migrations (database/scripts/V*.sql) to the database in
 * DATABASE_URL. Works against local or managed/cloud Postgres (SSL auto-on for
 * managed hosts). Run from the `server/` directory:
 *
 *   node scripts/apply-migrations.mjs
 *
 * Loads DATABASE_URL from .env.development or .env when not already set.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import pg from "pg";

for (const envFile of [".env.development", ".env"]) {
	if (process.env.DATABASE_URL) break;
	try {
		process.loadEnvFile(path.resolve(envFile));
	} catch {
		/* file may not exist */
	}
}

const url = process.env.DATABASE_URL;
if (!url) {
	console.error("DATABASE_URL is not set");
	process.exit(1);
}

const wantsSsl =
	process.env.DATABASE_SSL === "true" ||
	/sslmode=(require|verify-ca|verify-full|prefer)/i.test(url) ||
	/\.aivencloud\.com|\.supabase\.co|\.neon\.tech|rds\.amazonaws\.com/i.test(url);

const dir = path.resolve("database/scripts");
// Optional: start from a given file, e.g. `node scripts/apply-migrations.mjs V007`
// (useful to resume after some migrations already applied).
const startFrom = process.argv[2];
let files = readdirSync(dir)
	.filter((f) => /^V\d+.*\.sql$/.test(f))
	.sort();
if (startFrom) files = files.filter((f) => f >= startFrom);

// Strip `sslmode` from the URL so pg-connection-string doesn't force
// verify-full (which rejects managed providers' self-signed CA chains);
// we drive TLS explicitly via the `ssl` option instead.
let connectionString = url;
let host = "database";
try {
	const parsed = new URL(url);
	host = parsed.host;
	parsed.searchParams.delete("sslmode");
	connectionString = parsed.toString();
} catch {
	/* keep raw url */
}

const pool = new pg.Pool({
	connectionString,
	...(wantsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

console.log(`Applying ${files.length} migrations to ${host} (ssl=${wantsSsl})\n`);

let failed = 0;
for (const f of files) {
	// Strip a leading UTF-8 BOM (some source files carry one, which Postgres
	// would otherwise treat as a stray token → "syntax error near \uFFFD").
	const sql = readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "");
	process.stdout.write(`>>> ${f} ... `);
	try {
		await pool.query(sql);
		console.log("OK");
	} catch (e) {
		failed += 1;
		console.log("FAIL");
		console.error(`    ${e.message}`);
		break;
	}
}

await pool.end();

if (failed) {
	console.error(`\nMigration failed after error. Fix and re-run.`);
	process.exit(1);
}
console.log(`\nAll migrations applied to ${host}.`);
