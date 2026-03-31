import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "@/services";
import type { AdminHealthData } from "@/types/health";
import { formatDateTime } from "@/utils/format";
import "./SystemPage.css";

function getDatabaseInfo(health: AdminHealthData | null): string {
	if (!health) return "Unknown";
	if (health.database.status === "ok")
		return `${health.database.latencyMs} ms`;
	return health.database.message;
}

function getDatabaseTone(health: AdminHealthData | null): string {
	if (!health) return "neutral";
	return health.database.status === "ok" ? "success" : "danger";
}

export default function SystemPage() {
	const [health, setHealth] = useState<AdminHealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchHealth = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = await dashboardService.getHealth();
			setHealth(data);
			setLastUpdated(new Date().toISOString());
		} catch {
			setError("Failed to load system health data.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchHealth();
		const interval = setInterval(() => {
			void fetchHealth();
		}, 30000);
		return () => clearInterval(interval);
	}, [fetchHealth]);

	const uptimeStr = health
		? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
		: "—";

	return (
		<div className="system-page page-enter">
			<div className="page-header">
				<div>
					<h2 className="page-header__title">System Health</h2>
					<p className="page-header__subtitle">
						Server monitoring &amp; diagnostics
					</p>
				</div>
				<div className="page-header__controls">
					<button
						type="button"
						className="btn btn--primary btn--sm"
						onClick={() => void fetchHealth()}
						disabled={loading}>
						{loading ? "Checking…" : "↻ Refresh"}
					</button>
				</div>
			</div>

			{lastUpdated && (
				<p className="page-meta">
					Last checked: {formatDateTime(lastUpdated)} · Auto-refresh
					every 30s
				</p>
			)}

			{error && <p className="page-error">{error}</p>}

			{/* Status banner */}
			<div
				className={`system-status-banner system-status-banner--${health?.status ?? "unknown"}`}>
				<span className="system-status-banner__icon">
					{health?.status === "ok"
						? "✅"
						: health?.status === "degraded"
							? "⚠️"
							: "❓"}
				</span>
				<div className="system-status-banner__text">
					<strong className="system-status-banner__title">
						{health?.status === "ok"
							? "All systems operational"
							: health?.status === "degraded"
								? "System performance degraded"
								: "Status unknown"}
					</strong>
					<span className="system-status-banner__sub">
						{health?.version
							? `Version ${health.version}`
							: "Connecting…"}
					</span>
				</div>
			</div>

			<div className="system-grid">
				{/* Uptime & Version */}
				<div className="system-card">
					<h3 className="system-card__title">Server Info</h3>
					<dl className="system-dl">
						<div className="system-dl__row">
							<dt>Status</dt>
							<dd>
								<span
									className={`status-pill status-pill--${health?.status === "ok" ? "ok" : health?.status === "degraded" ? "degraded" : "unknown"}`}>
									{health?.status ?? "unknown"}
								</span>
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>Uptime</dt>
							<dd>{loading ? "—" : uptimeStr}</dd>
						</div>
						<div className="system-dl__row">
							<dt>Version</dt>
							<dd>{health?.version ?? "—"}</dd>
						</div>
					</dl>
				</div>

				{/* Database */}
				<div className="system-card">
					<h3 className="system-card__title">Database</h3>
					<dl className="system-dl">
						<div className="system-dl__row">
							<dt>Status</dt>
							<dd>
								<span
									className={`status-pill status-pill--${getDatabaseTone(health)}`}>
									{health?.database.status ?? "unknown"}
								</span>
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>Latency</dt>
							<dd>{getDatabaseInfo(health)}</dd>
						</div>
					</dl>
				</div>

				{/* Memory */}
				<div className="system-card">
					<h3 className="system-card__title">Memory</h3>
					<dl className="system-dl">
						<div className="system-dl__row">
							<dt>Heap Used</dt>
							<dd>
								{health
									? `${health.memory.heapUsedMB.toFixed(1)} MB`
									: "—"}
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>Heap Total</dt>
							<dd>
								{health
									? `${health.memory.heapTotalMB.toFixed(1)} MB`
									: "—"}
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>RSS</dt>
							<dd>
								{health
									? `${health.memory.rssMB.toFixed(1)} MB`
									: "—"}
							</dd>
						</div>
					</dl>

					{/* Memory usage bar */}
					{health && (
						<div className="memory-bar">
							<div className="memory-bar__track">
								<div
									className="memory-bar__fill"
									style={{
										width: `${Math.min((health.memory.heapUsedMB / health.memory.heapTotalMB) * 100, 100)}%`,
									}}
								/>
							</div>
							<span className="memory-bar__label">
								{(
									(health.memory.heapUsedMB /
										health.memory.heapTotalMB) *
									100
								).toFixed(0)}
								% used
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
