import { useCallback, useEffect, useState } from "react";
import {
	CircleCheck,
	CircleHelp,
	Database,
	MemoryStick,
	RefreshCw,
	Server,
	TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dashboardService } from "@/services";
import type { AdminHealthData } from "@/types/health";
import {
	formatDateTime,
	formatMegabytes,
	formatPercent,
	formatUptime,
	getUsagePercent,
} from "@/utils/format";
import "./SystemPage.css";

type SystemStatus = AdminHealthData["status"] | "unknown";

function getDatabaseInfo(health: AdminHealthData | null): string {
	if (!health) return "Unknown";
	if (health.database.status === "ok")
		return `${health.database.latencyMs} ms`;
	return health.database.message;
}

function getDatabaseTone(health: AdminHealthData | null): string {
	if (!health) return "unknown";
	return health.database.status === "ok" ? "success" : "danger";
}

function getSystemStatusMeta(status: SystemStatus): {
	Icon: LucideIcon;
	title: string;
	subtitle: string;
} {
	if (status === "ok") {
		return {
			Icon: CircleCheck,
			title: "All systems operational",
			subtitle: "Core services are responding normally",
		};
	}

	if (status === "degraded") {
		return {
			Icon: TriangleAlert,
			title: "System performance degraded",
			subtitle: "Review diagnostics and database response time",
		};
	}

	return {
		Icon: CircleHelp,
		title: "Status unknown",
		subtitle: "Connecting to system diagnostics",
	};
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

	const systemStatus = health?.status ?? "unknown";
	const statusMeta = getSystemStatusMeta(systemStatus);
	const StatusIcon = statusMeta.Icon;
	const uptimeStr = health ? formatUptime(health.uptime) : "—";
	const memoryUsage = health
		? getUsagePercent(health.memory.heapUsedMB, health.memory.heapTotalMB)
		: 0;

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
						{loading ? (
							<>
								<span className="spinner" />
								Checking...
							</>
						) : (
							<>
								<RefreshCw
									className="btn__icon"
									aria-hidden="true"
								/>
								Refresh
							</>
						)}
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
				className={`system-status-banner system-status-banner--${systemStatus}`}>
				<span
					className={`system-status-banner__icon system-status-banner__icon--${systemStatus}`}>
					<StatusIcon aria-hidden="true" />
				</span>
				<div className="system-status-banner__text">
					<strong className="system-status-banner__title">
						{statusMeta.title}
					</strong>
					<span className="system-status-banner__sub">
						{health?.version
							? `Version ${health.version}`
							: statusMeta.subtitle}
					</span>
				</div>
			</div>

			<div className="system-grid">
				{/* Uptime & Version */}
				<div className="system-card">
					<h3 className="system-card__title">
						<span className="system-card__title-icon">
							<Server aria-hidden="true" />
						</span>
						Server Info
					</h3>
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
					<h3 className="system-card__title">
						<span className="system-card__title-icon">
							<Database aria-hidden="true" />
						</span>
						Database
					</h3>
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
					<h3 className="system-card__title">
						<span className="system-card__title-icon">
							<MemoryStick aria-hidden="true" />
						</span>
						Memory
					</h3>
					<dl className="system-dl">
						<div className="system-dl__row">
							<dt>Heap Used</dt>
							<dd>
								{health
									? formatMegabytes(health.memory.heapUsedMB)
									: "—"}
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>Heap Total</dt>
							<dd>
								{health
									? formatMegabytes(health.memory.heapTotalMB)
									: "—"}
							</dd>
						</div>
						<div className="system-dl__row">
							<dt>RSS</dt>
							<dd>
								{health
									? formatMegabytes(health.memory.rssMB)
									: "—"}
							</dd>
						</div>
					</dl>

					{/* Memory usage bar */}
					<div className="memory-bar">
						<div className="memory-bar__track">
							<div
								className={`memory-bar__fill memory-bar__fill--${systemStatus}`}
								style={{ width: `${memoryUsage}%` }}
							/>
						</div>
						<span className="memory-bar__label">
							{health
								? `${formatPercent(memoryUsage)} used`
								: "Memory data unavailable"}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
