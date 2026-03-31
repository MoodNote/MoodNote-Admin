import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "@/services";
import type { AdminStatsData } from "@/types/stats";
import type {
	EmotionDistributionItem,
	TopKeyword,
	TrendPoint,
} from "@/types/stats";
import { formatCompact, formatDateTime } from "@/utils/format";
import "./AnalyticsPage.css";

type PeriodOption = 7 | 30 | 90;
type ActiveTab = "users" | "content";

const PERIOD_OPTIONS: PeriodOption[] = [7, 30, 90];

function formatTrendDate(date: string): string {
	const d = new Date(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	return `${day}/${month}`;
}

function TrendChart({
	data,
	emptyLabel,
}: {
	data: TrendPoint[];
	emptyLabel: string;
}) {
	if (data.length === 0) {
		return <p className="analytics-empty">{emptyLabel}</p>;
	}

	const max = Math.max(...data.map((p) => p.count), 1);

	return (
		<div className="trend-chart">
			{data.map((point) => {
				const pct = (point.count / max) * 100;
				return (
					<div
						key={point.date}
						className="trend-chart__bar-group">
						<div className="trend-chart__bar-track">
							<div
								className="trend-chart__bar"
								style={{ height: `${pct}%` }}
							/>
						</div>
						<span className="trend-chart__value">
							{formatCompact(point.count)}
						</span>
						<span className="trend-chart__label">
							{formatTrendDate(point.date)}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function EmotionBars({ data }: { data: EmotionDistributionItem[] }) {
	if (data.length === 0) {
		return (
			<p className="analytics-empty">No emotion data available.</p>
		);
	}
	const max = Math.max(...data.map((d) => d.count), 1);
	return (
		<div className="emotion-bars">
			{data.map((item) => {
				const key = item.emotion.toLowerCase();
				return (
					<div
						key={item.emotion}
						className="emotion-bars__row">
						<span className="emotion-bars__label">
							{item.emotion.charAt(0) +
								item.emotion.slice(1).toLowerCase()}
						</span>
						<div className="emotion-bars__track">
							<div
								className={`emotion-bars__fill emotion-bars__fill--${key}`}
								style={{ width: `${(item.count / max) * 100}%` }}
							/>
						</div>
						<span className="emotion-bars__value">
							{item.percentage !== undefined
								? `${item.percentage}%`
								: formatCompact(item.count)}
						</span>
					</div>
				);
			})}
		</div>
	);
}

function KeywordCloud({ data }: { data: TopKeyword[] }) {
	if (data.length === 0) {
		return (
			<p className="analytics-empty">No keyword data available.</p>
		);
	}
	return (
		<div className="keyword-cloud">
			{data.map((kw) => (
				<span
					key={kw.keyword}
					className="keyword-cloud__tag">
					{kw.keyword}
					<span className="keyword-cloud__count">{kw.count}</span>
				</span>
			))}
		</div>
	);
}

export default function AnalyticsPage() {
	const [tab, setTab] = useState<ActiveTab>("users");
	const [period, setPeriod] = useState<PeriodOption>(30);
	const [stats, setStats] = useState<AdminStatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchData = useCallback(async (p: PeriodOption) => {
		setLoading(true);
		setError("");
		try {
			const snapshot = await dashboardService.getSnapshot(p);
			setStats(snapshot.stats);
			if (snapshot.stats) {
				setLastUpdated(new Date().toISOString());
			} else {
				setError("Failed to load analytics data.");
			}
		} catch {
			setError("Failed to load analytics data.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchData(period);
	}, [fetchData, period]);

	const TABS: { id: ActiveTab; label: string }[] = [
		{ id: "users", label: "User Analytics" },
		{ id: "content", label: "Content Analytics" },
	];

	return (
		<div className="analytics-page page-enter">
			<div className="page-header">
				<div>
					<h2 className="page-header__title">Analytics</h2>
					<p className="page-header__subtitle">
						Deep dive into user engagement &amp; content trends
					</p>
				</div>
				<div className="page-header__controls">
					<select
						id="analytics-period"
						className="control-select"
						value={period}
						onChange={(e) =>
							setPeriod(Number(e.target.value) as PeriodOption)
						}>
						{PERIOD_OPTIONS.map((o) => (
							<option
								key={o}
								value={o}>
								Last {o} days
							</option>
						))}
					</select>
					<button
						type="button"
						className="btn btn--primary btn--sm"
						onClick={() => void fetchData(period)}
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

			<div className="analytics-tabs">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						className={`analytics-tab${tab === t.id ? " analytics-tab--active" : ""}`}
						onClick={() => setTab(t.id)}>
						{t.label}
					</button>
				))}
			</div>

			{tab === "users" && (
				<div className="analytics-grid">
					{/* Summary cards */}
					<div className="analytics-summary">
						<div className="summary-card">
							<span className="summary-card__label">DAU</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: stats?.users.dau !== undefined
										? formatCompact(stats.users.dau)
										: "N/A"}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">MAU</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: stats?.users.mau !== undefined
										? formatCompact(stats.users.mau)
										: "N/A"}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">
								Retention
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: stats?.users.retentionRate !== undefined
										? `${stats.users.retentionRate.toFixed(1)}%`
										: "N/A"}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">
								New this week
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.users.new.thisWeek ?? 0,
										)}
							</span>
						</div>
					</div>

					{/* Trend */}
					<div className="analytics-panel">
						<h3 className="analytics-panel__title">
							User Signup Trend
						</h3>
						<TrendChart
							data={stats?.users.trend ?? []}
							emptyLabel="No user trend data available."
						/>
					</div>
				</div>
			)}

			{tab === "content" && (
				<div className="analytics-grid">
					{/* Summary */}
					<div className="analytics-summary">
						<div className="summary-card">
							<span className="summary-card__label">
								Total Entries
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.entries.total ?? 0)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">Today</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.entries.new.today ?? 0,
										)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">
								Avg word count
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: stats?.entries.avgWordCount ?? "—"}
							</span>
						</div>
					</div>

					{/* Entry trend */}
					<div className="analytics-panel">
						<h3 className="analytics-panel__title">Entry Trend</h3>
						<TrendChart
							data={stats?.entries.trend ?? []}
							emptyLabel="No entry trend data available."
						/>
					</div>

					{/* Emotion distribution */}
					{stats?.entries.emotionDistribution && (
						<div className="analytics-panel">
							<h3 className="analytics-panel__title">
								Emotion Distribution
							</h3>
							<EmotionBars
								data={stats.entries.emotionDistribution}
							/>
						</div>
					)}

					{/* Top keywords */}
					{stats?.entries.topKeywords && (
						<div className="analytics-panel">
							<h3 className="analytics-panel__title">
								Top Keywords
							</h3>
							<KeywordCloud data={stats.entries.topKeywords} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
