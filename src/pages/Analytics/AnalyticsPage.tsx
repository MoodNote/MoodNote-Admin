import { useCallback, useEffect, useState } from "react";
import { dashboardService } from "@/services";
import type { AdminStatsData } from "@/types/stats";
import type {
	EmotionDistributionItem,
	TopKeyword,
} from "@/types/stats";
import { formatCompact, formatDateTime } from "@/utils/format";
import "./AnalyticsPage.css";

type ActiveTab = "users" | "content";

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
							{formatCompact(item.count)}
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
	const [stats, setStats] = useState<AdminStatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const snapshot = await dashboardService.getSnapshot();
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
		void fetchData();
	}, [fetchData]);

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
					<button
						type="button"
						className="btn btn--primary btn--sm"
						onClick={() => void fetchData()}
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
							<span className="summary-card__label">Total</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.users.total ?? 0)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">Active</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.users.active ?? 0)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">Inactive</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.users.inactive ?? 0)}
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
											stats?.users.newThisWeek ?? 0,
										)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">
								New this month
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.users.newThisMonth ?? 0,
										)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">New today</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.users.newToday ?? 0)}
							</span>
						</div>
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
									: formatCompact(stats?.entries.today ?? 0)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">This week</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.entries.thisWeek ?? 0,
										)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">
								This month
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.entries.thisMonth ?? 0,
										)}
							</span>
						</div>
						<div className="summary-card">
							<span className="summary-card__label">Analyzed</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.entries.analyzed ?? 0)}
							</span>
						</div>
					</div>

					{/* Emotion distribution */}
					{stats?.emotionDistribution &&
						stats.emotionDistribution.length > 0 && (
							<div className="analytics-panel">
								<h3 className="analytics-panel__title">
									Emotion Distribution
								</h3>
								<EmotionBars data={stats.emotionDistribution} />
							</div>
						)}

					{/* Top keywords */}
					{stats?.topKeywords && stats.topKeywords.length > 0 && (
						<div className="analytics-panel">
							<h3 className="analytics-panel__title">
								Top Keywords
							</h3>
							<KeywordCloud data={stats.topKeywords} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}
