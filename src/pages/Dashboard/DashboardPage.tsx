import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardService } from "@/services";
import type { AdminHealthData } from "@/types/health";
import type {
	AdminStatsData,
	EntriesAnalysisStatus,
	MusicCatalogStats,
} from "@/types/stats";
import { formatCompact, formatDateTime } from "@/utils/format";
import "./DashboardPage.css";

type PeriodOption = 7 | 30 | 90;

interface StatCardData {
	label: string;
	value: number | string | undefined;
	icon: string;
	color: "purple" | "green" | "blue" | "amber" | "pink" | "teal";
}

const PERIOD_OPTIONS: PeriodOption[] = [7, 30, 90];

function renderAnalysisStatus(status: EntriesAnalysisStatus | undefined) {
	if (!status) {
		return (
			<p className="panel-empty">No analysis status available.</p>
		);
	}

	const rows: { label: keyof EntriesAnalysisStatus; tone: string }[] = [
		{ label: "COMPLETED", tone: "success" },
		{ label: "PENDING", tone: "warning" },
		{ label: "PROCESSING", tone: "neutral" },
		{ label: "FAILED", tone: "danger" },
	];

	return (
		<div className="analysis-grid">
			{rows.map((row) => (
				<div
					key={row.label}
					className={`analysis-grid__item analysis-grid__item--${row.tone}`}>
					<span className="analysis-grid__label">{row.label}</span>
					<span className="analysis-grid__value">
						{formatCompact(status[row.label])}
					</span>
				</div>
			))}
		</div>
	);
}

export default function DashboardPage() {
	const [period, setPeriod] = useState<PeriodOption>(7);
	const [stats, setStats] = useState<AdminStatsData | null>(null);
	const [musicStats, setMusicStats] = useState<MusicCatalogStats | null>(
		null,
	);
	const [health, setHealth] = useState<AdminHealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchDashboardData = useCallback(
		async (selectedPeriod: PeriodOption) => {
			setLoading(true);
			setError("");
			try {
				const snapshot =
					await dashboardService.getSnapshot(selectedPeriod);
				setStats(snapshot.stats);
				setMusicStats(snapshot.musicStats);
				setHealth(snapshot.health);

				if (snapshot.successCount === 0) {
					setError("Failed to load dashboard data.");
				} else if (snapshot.successCount < 3) {
					setError("Some dashboard widgets could not be loaded.");
				}

				if (snapshot.successCount > 0) {
					setLastUpdated(new Date().toISOString());
				}
			} catch {
				setError("Failed to load dashboard data.");
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void fetchDashboardData(period);
		}, 0);
		return () => window.clearTimeout(timer);
	}, [fetchDashboardData, period]);

	const statCards: StatCardData[] = useMemo(() => {
		const cards: StatCardData[] = [
			{
				label: "Total Users",
				value: stats?.users.total,
				icon: "👥",
				color: "purple",
			},
			{
				label: "Active Users",
				value: stats?.users.active,
				icon: "✅",
				color: "green",
			},
			{
				label: "Total Entries",
				value: stats?.entries.total,
				icon: "📝",
				color: "blue",
			},
			{
				label: "Entries Today",
				value: stats?.entries.new.today,
				icon: "📅",
				color: "amber",
			},
			{
				label: "Tracks",
				value: musicStats?.totals.tracks,
				icon: "🎵",
				color: "pink",
			},
			{
				label: "Genres",
				value: musicStats?.totals.genres,
				icon: "🎧",
				color: "teal",
			},
		];

		if (stats?.users.dau !== undefined) {
			cards.push({
				label: "DAU",
				value: stats.users.dau,
				icon: "📊",
				color: "blue",
			});
		}
		if (stats?.users.mau !== undefined) {
			cards.push({
				label: "MAU",
				value: stats.users.mau,
				icon: "📈",
				color: "purple",
			});
		}
		if (stats?.users.retentionRate !== undefined) {
			cards.push({
				label: "Retention",
				value: `${stats.users.retentionRate.toFixed(1)}%`,
				icon: "🔄",
				color: "green",
			});
		}

		return cards;
	}, [musicStats, stats]);

	return (
		<div className="overview page-enter">
			<div className="page-header">
				<div>
					<h2 className="page-header__title">Overview</h2>
					<p className="page-header__subtitle">
						System snapshot at a glance
					</p>
				</div>
				<div className="page-header__controls">
					<label
						className="sr-only"
						htmlFor="period-select">
						Period
					</label>
					<select
						id="period-select"
						className="control-select"
						value={period}
						onChange={(e) =>
							setPeriod(Number(e.target.value) as PeriodOption)
						}>
						{PERIOD_OPTIONS.map((option) => (
							<option
								key={option}
								value={option}>
								Last {option} day{option > 1 ? "s" : ""}
							</option>
						))}
					</select>
					<button
						type="button"
						className="btn btn--primary btn--sm"
						onClick={() => void fetchDashboardData(period)}
						disabled={loading}>
						{loading ? "Loading…" : "↻ Refresh"}
					</button>
				</div>
			</div>

			{lastUpdated && (
				<p className="page-meta">
					Last updated: {formatDateTime(lastUpdated)}
				</p>
			)}

			{error && <p className="page-error">{error}</p>}

			{/* ── Stat cards ── */}
			<div className="overview-stats">
				{statCards.map((card) => (
					<div
						key={card.label}
						className="stat-card">
						<div
							className={`stat-card__icon stat-card__icon--${card.color}`}>
							{card.icon}
						</div>
						<div className="stat-card__body">
							<p className="stat-card__label">{card.label}</p>
							<p className="stat-card__value">
								{loading
									? "—"
									: card.value === undefined
										? "—"
										: typeof card.value === "string"
											? card.value
											: formatCompact(card.value)}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* ── Quick glance panels ── */}
			<div className="overview-panels">
				{/* Analysis Status */}
				<section className="overview-panel">
					<div className="overview-panel__head">
						<h3 className="overview-panel__title">
							Analysis Status
						</h3>
						<span className="overview-panel__hint">Entries</span>
					</div>
					{renderAnalysisStatus(stats?.entries.byAnalysisStatus)}
				</section>

				{/* Top Genres */}
				<section className="overview-panel">
					<div className="overview-panel__head">
						<h3 className="overview-panel__title">Top Genres</h3>
						<span className="overview-panel__hint">
							Music catalog
						</span>
					</div>
					<ul className="top-genres">
						{(musicStats?.topGenres.length ?? 0) === 0 ? (
							<li className="panel-empty">
								No genre data available.
							</li>
						) : (
							musicStats?.topGenres.map((genre, idx) => (
								<li
									key={genre.genreId}
									className="top-genres__item">
									<span className="top-genres__rank">
										{idx + 1}
									</span>
									<span className="top-genres__name">
										{genre.name}
									</span>
									<span className="top-genres__count">
										{formatCompact(genre.trackCount)} tracks
									</span>
								</li>
							))
						)}
					</ul>
				</section>

				{/* Quick Health */}
				<section
					className={`overview-panel overview-panel--health ${health?.status === "degraded" ? "overview-panel--degraded" : ""}`}>
					<div className="overview-panel__head">
						<h3 className="overview-panel__title">
							System Health
						</h3>
						<span
							className={`status-pill status-pill--${health?.status === "degraded" ? "degraded" : "ok"}`}>
							{health?.status ?? "unknown"}
						</span>
					</div>
					<dl className="health-dl">
						<div className="health-dl__row">
							<dt>Database</dt>
							<dd>
								{health?.database.status === "ok"
									? `${health.database.latencyMs} ms`
									: health?.database.status === "error"
										? health.database.message
										: "—"}
							</dd>
						</div>
						<div className="health-dl__row">
							<dt>Uptime</dt>
							<dd>
								{health
									? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
									: "—"}
							</dd>
						</div>
						<div className="health-dl__row">
							<dt>Version</dt>
							<dd>{health?.version ?? "—"}</dd>
						</div>
					</dl>
				</section>
			</div>
		</div>
	);
}
