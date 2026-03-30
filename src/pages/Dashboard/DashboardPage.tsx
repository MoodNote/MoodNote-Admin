import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardService } from "@/services";
import type { AdminHealthData } from "@/types/health";
import type {
	AdminStatsData,
	EmotionDistributionItem,
	EntriesAnalysisStatus,
	MusicCatalogStats,
	TopKeyword,
	TrendPoint,
} from "@/types/stats";
import { formatCompact, formatDateTime } from "@/utils/format";
import "./DashboardPage.css";

type PeriodOption = 7 | 30 | 90;

interface StatCardData {
	label: string;
	value: number | string | undefined;
	icon: string;
	color: "purple" | "green" | "blue" | "amber" | "pink" | "teal";
	suffix?: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [7, 30, 90];

function formatTrendDate(date: string): string {
	const d = new Date(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}`;
}

function renderTrendList(trend: TrendPoint[], emptyLabel: string) {
	if (trend.length === 0) {
		return <li className="trend-list__empty">{emptyLabel}</li>;
	}

	return trend.map((point) => (
		<li
			key={point.date}
			className="trend-list__item">
			<span className="trend-list__date">
				{formatTrendDate(point.date)}
			</span>
			<span className="trend-list__count">
				{formatCompact(point.count)}
			</span>
		</li>
	));
}

function renderAnalysisStatus(status: EntriesAnalysisStatus | undefined) {
	if (!status) {
		return (
			<p className="dashboard-panel__empty">
				No analysis status available.
			</p>
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

function renderEmotionDistribution(
	dist: EmotionDistributionItem[] | undefined,
) {
	if (!dist || dist.length === 0) {
		return (
			<p className="dashboard-panel__empty">
				No emotion data available.
			</p>
		);
	}
	const max = Math.max(...dist.map((d) => d.count), 1);
	return (
		<div className="emotion-panel">
			{dist.map((item) => {
				const key = item.emotion.toLowerCase();
				return (
					<div
						key={item.emotion}
						className="emotion-panel__item">
						<span className="emotion-panel__label">
							{item.emotion.charAt(0) +
								item.emotion.slice(1).toLowerCase()}
						</span>
						<div className="emotion-panel__bar-track">
							<div
								className={`emotion-panel__bar emotion-panel__bar--${key}`}
								style={{ width: `${(item.count / max) * 100}%` }}
							/>
						</div>
						<span className="emotion-panel__count">
							{item.percentage !== undefined
								? `${item.percentage}%`
								: item.count}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function renderTopKeywords(keywords: TopKeyword[] | undefined) {
	if (!keywords || keywords.length === 0) {
		return (
			<p className="dashboard-panel__empty">No keyword data available.</p>
		);
	}
	return (
		<div className="keywords-list">
			{keywords.map((kw) => (
				<span
					key={kw.keyword}
					className="keywords-list__tag">
					{kw.keyword}
					<span className="keywords-list__count">{kw.count}</span>
				</span>
			))}
		</div>
	);
}

function getDatabaseInfo(health: AdminHealthData | null): string {
	if (!health) return "Unknown";
	if (health.database.status === "ok")
		return `${health.database.latencyMs} ms`;
	return health.database.message;
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
					setError(
						"Failed to load dashboard data. Please try again.",
					);
				} else if (snapshot.successCount < 3) {
					setError("Some dashboard widgets could not be loaded.");
				}

				if (snapshot.successCount > 0) {
					setLastUpdated(new Date().toISOString());
				}
			} catch {
				setError("Failed to load dashboard data. Please try again.");
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

		return () => {
			window.clearTimeout(timer);
		};
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

		// Optional extended cards from SRS FR-25
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
				suffix: "%",
			});
		}

		return cards;
	}, [musicStats, stats]);

	return (
		<div className="dashboard">
			<div className="dashboard__header">
				<div>
					<h2 className="dashboard__title">Dashboard</h2>
					<p className="dashboard__subtitle">
						Live analytics and system health overview
					</p>
				</div>

				<div className="dashboard__controls">
					<label
						className="dashboard__control-label"
						htmlFor="period-select">
						Period
					</label>
					<select
						id="period-select"
						className="dashboard__period-select"
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
						className="dashboard__refresh-btn"
						onClick={() => void fetchDashboardData(period)}
						disabled={loading}>
						{loading ? "Refreshing..." : "↻ Refresh"}
					</button>
				</div>
			</div>

			{lastUpdated && (
				<p className="dashboard__meta">
					Last updated: {formatDateTime(lastUpdated)}
				</p>
			)}

			{error && <p className="dashboard__error">{error}</p>}

			<div className="dashboard__stats">
				{statCards.map((card) => (
					<div
						key={card.label}
						className="stat-card">
						<div
							className={`stat-card__icon-wrap stat-card__icon-wrap--${card.color}`}>
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

			<div className="dashboard-panels">
				<section className="dashboard-panel">
					<div className="dashboard-panel__head">
						<h3 className="dashboard-panel__title">
							User Signup Trend
						</h3>
						<span className="dashboard-panel__hint">{period}d</span>
					</div>
					<ul className="trend-list">
						{renderTrendList(
							stats?.users.trend ?? [],
							"No user trend data available.",
						)}
					</ul>
				</section>

				<section className="dashboard-panel">
					<div className="dashboard-panel__head">
						<h3 className="dashboard-panel__title">Entry Trend</h3>
						<span className="dashboard-panel__hint">{period}d</span>
					</div>
					<ul className="trend-list">
						{renderTrendList(
							stats?.entries.trend ?? [],
							"No entry trend data available.",
						)}
					</ul>
				</section>

				<section className="dashboard-panel">
					<div className="dashboard-panel__head">
						<h3 className="dashboard-panel__title">
							Analysis Status
						</h3>
						<span className="dashboard-panel__hint">Entries</span>
					</div>
					{renderAnalysisStatus(stats?.entries.byAnalysisStatus)}
				</section>

				<section className="dashboard-panel">
					<div className="dashboard-panel__head">
						<h3 className="dashboard-panel__title">Top Genres</h3>
						<span className="dashboard-panel__hint">
							Music catalog
						</span>
					</div>
					<ul className="top-genres-list">
						{(musicStats?.topGenres.length ?? 0) === 0 ? (
							<li className="top-genres-list__empty">
								No genre data available.
							</li>
						) : (
							musicStats?.topGenres.map((genre, idx) => (
								<li
									key={genre.genreId}
									className="top-genres-list__item">
									<span className="top-genres-list__rank">
										{idx + 1}
									</span>
									<span className="top-genres-list__name">
										{genre.name}
									</span>
									<span className="top-genres-list__count">
										{formatCompact(genre.trackCount)}{" "}
										tracks
									</span>
								</li>
							))
						)}
					</ul>
				</section>

				{/* Emotion Distribution — SRS FR-25 */}
				{stats?.entries.emotionDistribution !== undefined && (
					<section className="dashboard-panel">
						<div className="dashboard-panel__head">
							<h3 className="dashboard-panel__title">
								Emotion Distribution
							</h3>
							<span className="dashboard-panel__hint">
								All users
							</span>
						</div>
						{renderEmotionDistribution(
							stats.entries.emotionDistribution,
						)}
					</section>
				)}

				{/* Top Keywords — SRS FR-25 */}
				{stats?.entries.topKeywords !== undefined && (
					<section className="dashboard-panel">
						<div className="dashboard-panel__head">
							<h3 className="dashboard-panel__title">
								Top Keywords
							</h3>
							<span className="dashboard-panel__hint">
								{period}d
							</span>
						</div>
						{renderTopKeywords(stats.entries.topKeywords)}
					</section>
				)}

				<section
					className={`dashboard-panel health-card ${health?.status === "degraded" ? "health-card--degraded" : ""}`}>
					<div className="dashboard-panel__head">
						<h3 className="dashboard-panel__title">
							System Health
						</h3>
						<span
							className={`health-pill ${health?.status === "degraded" ? "health-pill--degraded" : "health-pill--ok"}`}>
							{health?.status ?? "unknown"}
						</span>
					</div>

					<dl className="health-list">
						<div className="health-list__row">
							<dt>Database</dt>
							<dd>{getDatabaseInfo(health)}</dd>
						</div>
						<div className="health-list__row">
							<dt>Version</dt>
							<dd>{health?.version ?? "—"}</dd>
						</div>
						<div className="health-list__row">
							<dt>Uptime</dt>
							<dd>
								{health
									? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`
									: "—"}
							</dd>
						</div>
						<div className="health-list__row">
							<dt>Heap Used</dt>
							<dd>
								{health
									? `${health.memory.heapUsedMB.toFixed(1)} MB`
									: "—"}
							</dd>
						</div>
						<div className="health-list__row">
							<dt>RSS</dt>
							<dd>
								{health
									? `${health.memory.rssMB.toFixed(1)} MB`
									: "—"}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		</div>
	);
}
