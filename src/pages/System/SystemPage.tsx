import { useCallback, useEffect, useState } from "react";
import {
	Activity,
	BrainCircuit,
	CircleCheck,
	CircleHelp,
	Database,
	MemoryStick,
	RefreshCw,
	RotateCcw,
	Server,
	Sparkles,
	TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { aiService, dashboardService } from "@/services";
import type { AiStatsData, AnalysisStatus } from "@/types/ai";
import type { AdminHealthData } from "@/types/health";
import {
	formatDateTime,
	formatMegabytes,
	formatPercent,
	formatUptime,
	getUsagePercent,
} from "@/utils/format";
import { notifyError, notifySuccess } from "@/utils/toast";
import "./SystemPage.css";

type SystemStatus = AdminHealthData["status"] | "unknown";
type AiMetricTone = "neutral" | "warning" | "success" | "danger";

const AI_STATUS_METRICS: {
	label: string;
	status?: AnalysisStatus;
	tone: AiMetricTone;
}[] = [
	{ label: "Total", tone: "neutral" },
	{ label: "Pending", status: "PENDING", tone: "warning" },
	{ label: "Processing", status: "PROCESSING", tone: "warning" },
	{ label: "Completed", status: "COMPLETED", tone: "success" },
	{ label: "Failed", status: "FAILED", tone: "danger" },
];

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

function getAiMetricValue(
	stats: AiStatsData | null,
	status?: AnalysisStatus,
): number {
	if (!stats) return 0;
	return status ? (stats.byStatus[status] ?? 0) : stats.total;
}

export default function SystemPage() {
	const [health, setHealth] = useState<AdminHealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);
	const [aiStats, setAiStats] = useState<AiStatsData | null>(null);
	const [aiLoading, setAiLoading] = useState(true);
	const [aiError, setAiError] = useState("");
	const [aiLastUpdated, setAiLastUpdated] = useState<string | null>(null);
	const [retryLoading, setRetryLoading] = useState(false);
	const [reAnalyzeLoading, setReAnalyzeLoading] = useState(false);
	const [entryId, setEntryId] = useState("");
	const [entryIdError, setEntryIdError] = useState("");
	const [retryConfirmOpen, setRetryConfirmOpen] = useState(false);

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

	const fetchAiStats = useCallback(async () => {
		setAiLoading(true);
		setAiError("");
		try {
			const data = await aiService.getStats();
			setAiStats(data);
			setAiLastUpdated(new Date().toISOString());
		} catch (err) {
			setAiError("Failed to load AI analysis stats.");
			notifyError(err, "Failed to load AI analysis stats.");
		} finally {
			setAiLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchHealth();
		const interval = setInterval(() => {
			void fetchHealth();
		}, 30000);
		return () => clearInterval(interval);
	}, [fetchHealth]);

	useEffect(() => {
		void fetchAiStats();
	}, [fetchAiStats]);

	const handleReAnalyzeEntry = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();

		const trimmedEntryId = entryId.trim();
		if (!trimmedEntryId) {
			setEntryIdError("Entry ID is required.");
			return;
		}

		setEntryIdError("");
		setReAnalyzeLoading(true);
		try {
			const response = await aiService.reAnalyzeEntry(trimmedEntryId);
			notifySuccess(response.message || "Re-analysis started.");
			setEntryId("");
			void fetchAiStats();
		} catch (err) {
			notifyError(err, "Failed to start re-analysis.");
		} finally {
			setReAnalyzeLoading(false);
		}
	};

	const handleRetryFailed = async () => {
		setRetryLoading(true);
		try {
			const data = await aiService.retryFailed();
			notifySuccess(
				data.queued > 0
					? `${data.queued.toLocaleString()} failed entries queued.`
					: "No failed entries were queued.",
			);
			setRetryConfirmOpen(false);
			void fetchAiStats();
		} catch (err) {
			notifyError(err, "Failed to retry failed analyses.");
		} finally {
			setRetryLoading(false);
		}
	};

	const systemStatus = health?.status ?? "unknown";
	const statusMeta = getSystemStatusMeta(systemStatus);
	const StatusIcon = statusMeta.Icon;
	const uptimeStr = health ? formatUptime(health.uptime) : "—";
	const memoryUsage = health
		? getUsagePercent(health.memory.heapUsedMB, health.memory.heapTotalMB)
		: 0;
	const isAiActionLoading = retryLoading || reAnalyzeLoading;

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

			<section className="ai-ops">
				<div className="ai-ops__header">
					<div>
						<h3 className="ai-ops__title">
							<span className="ai-ops__title-icon">
								<BrainCircuit aria-hidden="true" />
							</span>
							AI Operations
						</h3>
						<p className="ai-ops__subtitle">
							Analysis queue controls for journal entries
						</p>
					</div>
					<button
						type="button"
						className="btn btn--outline btn--sm"
						onClick={() => void fetchAiStats()}
						disabled={aiLoading}>
						{aiLoading ? (
							<>
								<span className="spinner" />
								Loading...
							</>
						) : (
							<>
								<RefreshCw
									className="btn__icon"
									aria-hidden="true"
								/>
								Refresh AI
							</>
						)}
					</button>
				</div>

				{aiLastUpdated && (
					<p className="ai-ops__meta">
						AI stats updated: {formatDateTime(aiLastUpdated)}
					</p>
				)}

				{aiError && <p className="ai-ops__error">{aiError}</p>}

				<div className="ai-stats-grid">
					{AI_STATUS_METRICS.map((metric) => (
						<div
							key={metric.label}
							className={`ai-stat ai-stat--${metric.tone}`}>
							<span className="ai-stat__label">{metric.label}</span>
							<strong className="ai-stat__value">
								{aiLoading
									? "..."
									: getAiMetricValue(
											aiStats,
											metric.status,
										).toLocaleString()}
							</strong>
						</div>
					))}
				</div>

				<div className="ai-actions">
					<form
						className="ai-action-card"
						onSubmit={(event) => void handleReAnalyzeEntry(event)}
						noValidate>
						<div className="ai-action-card__head">
							<span className="ai-action-card__icon">
								<Sparkles aria-hidden="true" />
							</span>
							<div>
								<h4 className="ai-action-card__title">
									Re-analyze entry
								</h4>
								<p className="ai-action-card__desc">
									Queue one journal entry for a fresh AI pass.
								</p>
							</div>
						</div>

						<label
							className="ai-form__label"
							htmlFor="ai-entry-id">
							Entry ID
						</label>
						<div className="ai-form__row">
							<input
								id="ai-entry-id"
								className="ai-form__input"
								type="text"
								value={entryId}
								onChange={(event) => {
									setEntryId(event.target.value);
									if (entryIdError) setEntryIdError("");
								}}
								placeholder="Paste entry ID"
								disabled={reAnalyzeLoading}
								autoComplete="off"
							/>
							<button
								type="submit"
								className="btn btn--primary btn--sm ai-form__submit"
								disabled={reAnalyzeLoading}>
								{reAnalyzeLoading ? (
									<>
										<span className="spinner" />
										Starting...
									</>
								) : (
									<>
										<Sparkles
											className="btn__icon"
											aria-hidden="true"
										/>
										Re-analyze
									</>
								)}
							</button>
						</div>
						{entryIdError && (
							<p className="ai-form__error">{entryIdError}</p>
						)}
					</form>

					<div className="ai-action-card ai-action-card--retry">
						<div className="ai-action-card__head">
							<span className="ai-action-card__icon ai-action-card__icon--warning">
								<RotateCcw aria-hidden="true" />
							</span>
							<div>
								<h4 className="ai-action-card__title">
									Retry failed analyses
								</h4>
								<p className="ai-action-card__desc">
									Queue every entry currently marked as failed.
								</p>
							</div>
						</div>

						<div className="ai-retry-summary">
							<span>Failed entries</span>
							<strong>
								{aiLoading
									? "..."
									: getAiMetricValue(aiStats, "FAILED").toLocaleString()}
							</strong>
						</div>

						<button
							type="button"
							className="btn btn--outline btn--sm ai-retry-btn"
							onClick={() => setRetryConfirmOpen(true)}
							disabled={isAiActionLoading}>
							{retryLoading ? (
								<>
									<span className="spinner" />
									Queueing...
								</>
							) : (
								<>
									<RotateCcw
										className="btn__icon"
										aria-hidden="true"
									/>
									Retry failed
								</>
							)}
						</button>
					</div>
				</div>
			</section>

			<ConfirmDialog
				open={retryConfirmOpen}
				onOpenChange={setRetryConfirmOpen}
				title="Retry failed analyses?"
				description="This will queue every entry whose AI analysis status is failed."
				confirmLabel="Retry failed"
				cancelLabel="Cancel"
				loading={retryLoading}
				onConfirm={() => void handleRetryFailed()}>
				<div className="ai-confirm-summary">
					<Activity aria-hidden="true" />
					<span>
						{getAiMetricValue(aiStats, "FAILED").toLocaleString()} failed
						entries currently reported.
					</span>
				</div>
			</ConfirmDialog>
		</div>
	);
}
