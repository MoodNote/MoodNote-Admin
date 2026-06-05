import { useCallback, useEffect, useMemo, useState } from "react";
import {
	CalendarDays,
	CircleCheck,
	CircleHelp,
	Clock,
	Database,
	FileText,
	Headphones,
	MemoryStick,
	Music,
	RefreshCw,
	Server,
	TriangleAlert,
	UserCheck,
	Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dashboardService } from "@/services";
import type { AdminHealthData } from "@/types/health";
import type { AdminStatsData, MusicCatalogStats } from "@/types/stats";
import {
	formatCompact,
	formatDateTime,
	formatMegabytes,
	formatPercent,
	formatUptime,
	getUsagePercent,
} from "@/utils/format";
import "./DashboardPage.css";

type StatCardTone = "purple" | "green" | "blue" | "amber" | "pink" | "teal";
type HealthTone = AdminHealthData["status"] | "unknown";

interface StatCardData {
	label: string;
	value: number | string | undefined;
	icon: LucideIcon;
	color: StatCardTone;
}

function getHealthTone(health: AdminHealthData | null): HealthTone {
	return health?.status ?? "unknown";
}

function getHealthStatusMeta(tone: HealthTone): {
	Icon: LucideIcon;
	description: string;
} {
	if (tone === "ok") {
		return {
			Icon: CircleCheck,
			description: "All systems operational",
		};
	}

	if (tone === "degraded") {
		return {
			Icon: TriangleAlert,
			description: "Performance needs attention",
		};
	}

	return {
		Icon: CircleHelp,
		description: "Waiting for health data",
	};
}

function getDatabaseInfo(health: AdminHealthData | null): string {
	if (!health) return "—";
	if (health.database.status === "ok") {
		return `${health.database.latencyMs} ms`;
	}
	return health.database.message;
}

function getDatabaseTone(health: AdminHealthData | null): HealthTone {
	if (!health) return "unknown";
	return health.database.status === "ok" ? "ok" : "degraded";
}

export default function DashboardPage() {
	const [stats, setStats] = useState<AdminStatsData | null>(null);
	const [musicStats, setMusicStats] = useState<MusicCatalogStats | null>(
		null,
	);
	const [health, setHealth] = useState<AdminHealthData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchDashboardData = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const snapshot = await dashboardService.getSnapshot();
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
	}, []);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void fetchDashboardData();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [fetchDashboardData]);

	const statCards: StatCardData[] = useMemo(() => {
		const cards: StatCardData[] = [
			{
				label: "Total Users",
				value: stats?.users.total,
				icon: Users,
				color: "purple",
			},
			{
				label: "Active Users",
				value: stats?.users.active,
				icon: UserCheck,
				color: "green",
			},
			{
				label: "Total Entries",
				value: stats?.entries.total,
				icon: FileText,
				color: "blue",
			},
			{
				label: "Entries Today",
				value: stats?.entries.today,
				icon: CalendarDays,
				color: "amber",
			},
			{
				label: "Tracks",
				value: musicStats?.totals.tracks,
				icon: Music,
				color: "pink",
			},
			{
				label: "Genres",
				value: musicStats?.totals.genres,
				icon: Headphones,
				color: "teal",
			},
		];

		return cards;
	}, [musicStats, stats]);

	const healthTone = getHealthTone(health);
	const healthMeta = getHealthStatusMeta(healthTone);
	const HealthStatusIcon = healthMeta.Icon;
	const memoryUsage = health
		? getUsagePercent(health.memory.heapUsedMB, health.memory.heapTotalMB)
		: 0;

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
					<button
						type="button"
						className="btn btn--primary btn--sm"
						onClick={() => void fetchDashboardData()}
						disabled={loading}>
						{loading ? (
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
								Refresh
							</>
						)}
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
				{statCards.map((card) => {
					const Icon = card.icon;

					return (
						<div
							key={card.label}
							className="stat-card">
							<div
								className={`stat-card__icon stat-card__icon--${card.color}`}>
								<Icon aria-hidden="true" />
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
					);
				})}
			</div>

			{/* ── Quick glance panels ── */}
			<div className="overview-panels">
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
							musicStats?.topGenres
								.slice(0, 5)
								.map((genre, idx) => (
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
											{formatCompact(genre.trackCount)}{" "}
											tracks
										</span>
									</li>
								))
						)}
					</ul>
				</section>

				{/* Quick Health */}
				<section
					className={`overview-panel overview-panel--health overview-panel--${healthTone}`}>
					<div className="health-summary">
						<span
							className={`health-summary__icon health-summary__icon--${healthTone}`}>
							<HealthStatusIcon aria-hidden="true" />
						</span>
						<div className="health-summary__body">
							<h3 className="overview-panel__title">
								System Health
							</h3>
							<p className="health-summary__text">
								{healthMeta.description}
							</p>
						</div>
						<span
							className={`status-pill status-pill--${healthTone}`}>
							{healthTone}
						</span>
					</div>

					<div className="health-metrics">
						<div
							className={`health-metric health-metric--${getDatabaseTone(health)}`}>
							<span className="health-metric__icon">
								<Database aria-hidden="true" />
							</span>
							<span className="health-metric__label">
								Database
							</span>
							<strong className="health-metric__value">
								{getDatabaseInfo(health)}
							</strong>
						</div>
						<div className="health-metric health-metric--neutral">
							<span className="health-metric__icon">
								<Clock aria-hidden="true" />
							</span>
							<span className="health-metric__label">Uptime</span>
							<strong className="health-metric__value">
								{health ? formatUptime(health.uptime) : "—"}
							</strong>
						</div>
						<div className="health-metric health-metric--neutral">
							<span className="health-metric__icon">
								<Server aria-hidden="true" />
							</span>
							<span className="health-metric__label">
								Version
							</span>
							<strong className="health-metric__value">
								{health?.version ?? "—"}
							</strong>
						</div>
					</div>

					<div className="health-memory">
						<div className="health-memory__head">
							<span>
								<MemoryStick aria-hidden="true" />
								Memory
							</span>
							<strong>
								{health
									? `${formatPercent(memoryUsage)} used`
									: "—"}
							</strong>
						</div>
						<div className="health-memory__track">
							<div
								className={`health-memory__fill health-memory__fill--${healthTone}`}
								style={{ width: `${memoryUsage}%` }}
							/>
						</div>
						<p className="health-memory__meta">
							{health
								? `${formatMegabytes(health.memory.heapUsedMB)} / ${formatMegabytes(health.memory.heapTotalMB)} heap`
								: "Memory data unavailable"}
						</p>
					</div>
				</section>
			</div>
		</div>
	);
}
