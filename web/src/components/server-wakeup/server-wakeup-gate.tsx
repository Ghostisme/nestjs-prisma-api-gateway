import { useCallback, useEffect, useRef, useState } from "react";
import { GLOBAL_CONFIG } from "@/global-config";

/**
 * ServerWakeupGate
 * ----------------
 * Gracefully handles the cold start of a serverless / auto-suspending backend
 * (typically a free-tier Postgres that sleeps when idle).
 *
 * Behaviour:
 *  - Warm path: if the readiness probe answers within `warmThresholdMs`, the
 *    overlay never renders — the app boots instantly (so local dev is unaffected).
 *  - Cold path: if the first probe is slow, a polished "waking up" overlay is
 *    shown with an animated progress estimate and a short bilingual note, while
 *    the probe is retried until the database is reachable. Only then are the
 *    children mounted, so the app never fires a wall of requests at a cold DB.
 *  - Failure path: after `maxWaitMs` a retry affordance is shown instead of
 *    hanging forever.
 *
 * The readiness probe hits `GET {apiBaseUrl}/health/ready`, which runs a
 * `SELECT 1` on the server — so this state reflects the *database* waking up,
 * not just the web process.
 */

type Status = "checking" | "waking" | "ready" | "error";

export interface ServerWakeupGateProps {
	children: React.ReactNode;
	/** Readiness probe URL. Defaults to `${GLOBAL_CONFIG.apiBaseUrl}/health/ready`. */
	probeUrl?: string;
	/** If the first probe resolves within this many ms, skip the overlay entirely. */
	warmThresholdMs?: number;
	/** Per-attempt fetch timeout. */
	attemptTimeoutMs?: number;
	/** Delay between poll attempts. */
	pollIntervalMs?: number;
	/** Estimated cold-start duration, used to animate the progress bar. */
	estimatedColdStartMs?: number;
	/** Give up and show a retry button after this long. */
	maxWaitMs?: number;
	/** Set false to bypass the gate entirely (renders children immediately). */
	enabled?: boolean;
}

const DEFAULTS = {
	warmThresholdMs: 1000,
	attemptTimeoutMs: 8000,
	pollIntervalMs: 2000,
	estimatedColdStartMs: 25000,
	maxWaitMs: 90000,
};

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** One readiness probe. Resolves true when the DB-backed endpoint reports ready. */
async function probeOnce(url: string, timeoutMs: number): Promise<boolean> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			method: "GET",
			signal: controller.signal,
			headers: { Accept: "application/json" },
			cache: "no-store",
		});
		if (!res.ok) return false;
		const body = await res.json().catch(() => null);
		// Accept both the wrapped envelope ({ code, data:{ status } }) and a raw body.
		const payload = body?.data ?? body;
		if (!payload) return res.ok; // 200 with empty/opaque body → treat as ready
		return payload.status === "ready" || payload.status === "ok" || payload.database === "up";
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}

export default function ServerWakeupGate({
	children,
	probeUrl,
	warmThresholdMs = DEFAULTS.warmThresholdMs,
	attemptTimeoutMs = DEFAULTS.attemptTimeoutMs,
	pollIntervalMs = DEFAULTS.pollIntervalMs,
	estimatedColdStartMs = DEFAULTS.estimatedColdStartMs,
	maxWaitMs = DEFAULTS.maxWaitMs,
	enabled = true,
}: ServerWakeupGateProps) {
	const url = probeUrl ?? `${GLOBAL_CONFIG.apiBaseUrl}/health/ready`;

	const [status, setStatus] = useState<Status>(enabled ? "checking" : "ready");
	const [elapsedMs, setElapsedMs] = useState(0);
	const [attempts, setAttempts] = useState(0);
	const [runToken, setRunToken] = useState(0);

	const mountedRef = useRef(true);
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
		};
	}, []);

	const runWakeup = useCallback(async () => {
		if (!enabled) {
			setStatus("ready");
			return;
		}
		const startedAt = Date.now();
		setElapsedMs(0);
		setAttempts(0);
		setStatus("checking");

		// Only reveal the overlay if we're still not ready after the warm threshold,
		// so a warm backend (e.g. local dev) never flashes the loader.
		const revealTimer = setTimeout(() => {
			if (mountedRef.current) setStatus((s) => (s === "checking" ? "waking" : s));
		}, warmThresholdMs);

		let attempt = 0;
		while (mountedRef.current) {
			attempt += 1;
			setAttempts(attempt);
			const ok = await probeOnce(url, attemptTimeoutMs);
			if (!mountedRef.current) break;
			if (ok) {
				clearTimeout(revealTimer);
				setStatus("ready");
				return;
			}
			if (Date.now() - startedAt > maxWaitMs) {
				clearTimeout(revealTimer);
				setStatus("error");
				return;
			}
			await sleep(pollIntervalMs);
		}
		clearTimeout(revealTimer);
	}, [enabled, url, warmThresholdMs, attemptTimeoutMs, pollIntervalMs, maxWaitMs]);

	// Kick off (and re-run on retry via runToken).
	useEffect(() => {
		void runWakeup();
	}, [runWakeup, runToken]);

	// Tick the elapsed clock only while the overlay is visible.
	useEffect(() => {
		if (status !== "waking") return;
		const startedAt = Date.now() - elapsedMs;
		const id = setInterval(() => {
			if (mountedRef.current) setElapsedMs(Date.now() - startedAt);
		}, 200);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [status]);

	if (!enabled || status === "ready") {
		return <>{children}</>;
	}

	// While "checking" (pre-threshold) render nothing to avoid a flash.
	if (status === "checking") {
		return null;
	}

	// Asymptotic progress toward 90%, then snap to 100% on ready.
	const progress = Math.min(90, Math.round((1 - Math.exp(-elapsedMs / estimatedColdStartMs)) * 100));
	const seconds = Math.floor(elapsedMs / 1000);

	return (
		<WakeupOverlay
			status={status}
			progress={progress}
			seconds={seconds}
			attempts={attempts}
			onRetry={() => {
				setStatus("checking");
				setRunToken((t) => t + 1);
			}}
		/>
	);
}

function WakeupOverlay({
	status,
	progress,
	seconds,
	attempts,
	onRetry,
}: {
	status: Status;
	progress: number;
	seconds: number;
	attempts: number;
	onRetry: () => void;
}) {
	const isError = status === "error";

	return (
		<div style={styles.backdrop} role="status" aria-live="polite">
			<style>{keyframes}</style>
			<div style={styles.card}>
				<div style={styles.iconWrap}>
					<div style={{ ...styles.pulseRing, animationPlayState: isError ? "paused" : "running" }} />
					<div style={styles.dbIcon}>
						{/* Simple database glyph */}
						<svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
							<ellipse cx="12" cy="5" rx="8" ry="3" stroke="#fff" strokeWidth="1.6" />
							<path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" stroke="#fff" strokeWidth="1.6" />
							<path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" stroke="#fff" strokeWidth="1.6" />
						</svg>
					</div>
				</div>

				<h2 style={styles.title}>{isError ? "Server unavailable" : "Waking up the server…"}</h2>
				<p style={styles.subtitle}>
					{isError
						? "The demo backend didn't wake up in time."
						: "Waking up the demo database — this only happens after it's been idle."}
				</p>

				{!isError && (
					<>
						<div style={styles.progressTrack}>
							<div style={{ ...styles.progressBar, width: `${progress}%` }}>
								<div style={styles.progressShimmer} />
							</div>
						</div>
						<div style={styles.meta}>
							<span>{seconds}s</span>
							<span style={styles.dots}>
								<Dot delay="0s" />
								<Dot delay="0.2s" />
								<Dot delay="0.4s" />
							</span>
							<span>~15–30s</span>
						</div>
					</>
				)}

				<div style={styles.note}>
					⏳ This demo runs on a free serverless database tier that auto-suspends when idle to minimize
					cost. The first request after inactivity may take 15–30s to cold-start; subsequent requests
					are instant.
				</div>

				{isError && (
					<button type="button" style={styles.retryBtn} onClick={onRetry}>
						Retry
					</button>
				)}

				{!isError && attempts > 1 && (
					<div style={styles.attempts}>attempt #{attempts}</div>
				)}
			</div>
		</div>
	);
}

function Dot({ delay }: { delay: string }) {
	return <span style={{ ...styles.dot, animationDelay: delay }} />;
}

const keyframes = `
@keyframes lmx-pulse { 0% { transform: scale(0.85); opacity: 0.7; } 70% { transform: scale(1.35); opacity: 0; } 100% { transform: scale(1.35); opacity: 0; } }
@keyframes lmx-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
@keyframes lmx-dot { 0%, 60%, 100% { opacity: 0.25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
@keyframes lmx-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

const ACCENT = "#4f46e5";
const ACCENT_2 = "#06b6d4";

const styles: Record<string, React.CSSProperties> = {
	backdrop: {
		position: "fixed",
		inset: 0,
		zIndex: 9999,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: "radial-gradient(1200px 600px at 50% -10%, #1e293b 0%, #0b1120 60%, #060913 100%)",
		backdropFilter: "blur(6px)",
		padding: 24,
	},
	card: {
		width: "min(440px, 92vw)",
		borderRadius: 18,
		padding: "32px 28px 26px",
		background: "rgba(255,255,255,0.06)",
		border: "1px solid rgba(255,255,255,0.12)",
		boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
		color: "#e2e8f0",
		textAlign: "center",
		animation: "lmx-fade 0.4s ease both",
		backdropFilter: "blur(4px)",
	},
	iconWrap: {
		position: "relative",
		width: 72,
		height: 72,
		margin: "0 auto 18px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	},
	pulseRing: {
		position: "absolute",
		inset: 0,
		borderRadius: "50%",
		background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
		animation: "lmx-pulse 1.8s ease-out infinite",
	},
	dbIcon: {
		position: "relative",
		width: 60,
		height: 60,
		borderRadius: "50%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
		boxShadow: `0 8px 24px rgba(79,70,229,0.5)`,
	},
	title: { margin: "0 0 6px", fontSize: 19, fontWeight: 600, color: "#f8fafc" },
	subtitle: { margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.5 },
	progressTrack: {
		position: "relative",
		height: 8,
		borderRadius: 999,
		background: "rgba(255,255,255,0.10)",
		overflow: "hidden",
	},
	progressBar: {
		position: "relative",
		height: "100%",
		borderRadius: 999,
		background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_2})`,
		transition: "width 0.6s ease",
		overflow: "hidden",
	},
	progressShimmer: {
		position: "absolute",
		inset: 0,
		background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
		animation: "lmx-shimmer 1.4s linear infinite",
	},
	meta: {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		marginTop: 10,
		fontSize: 12,
		color: "#94a3b8",
	},
	dots: { display: "inline-flex", gap: 5, alignItems: "center" },
	dot: {
		width: 6,
		height: 6,
		borderRadius: "50%",
		background: ACCENT_2,
		display: "inline-block",
		animation: "lmx-dot 1.2s ease-in-out infinite",
	},
	note: {
		marginTop: 20,
		padding: "12px 14px",
		borderRadius: 10,
		background: "rgba(255,255,255,0.05)",
		border: "1px solid rgba(255,255,255,0.08)",
		fontSize: 12,
		lineHeight: 1.6,
		color: "#cbd5e1",
		textAlign: "left",
	},
	retryBtn: {
		marginTop: 18,
		padding: "9px 22px",
		borderRadius: 10,
		border: "none",
		cursor: "pointer",
		fontSize: 13,
		fontWeight: 600,
		color: "#fff",
		background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_2})`,
	},
	attempts: { marginTop: 12, fontSize: 11, color: "#64748b" },
};
