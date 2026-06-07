import { useCallback, useEffect, useState } from "react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { dashboardService } from "@/services";
import type { AdminStatsData, GrowthData, GrowthPeriod } from "@/types/stats";
import type { EmotionDistributionItem, TopKeyword } from "@/types/stats";
import { formatCompact, formatDateTime } from "@/utils/format";
import "./AnalyticsPage.css";

const CHART_GRID = "rgba(148, 163, 184, 0.14)";
const CHART_AXIS = "rgba(203, 213, 225, 0.72)";
const CHART_TOOLTIP = {
	backgroundColor: "var(--color-bg-card)",
	border: "1px solid var(--color-border-hover)",
	borderRadius: "10px",
	boxShadow: "var(--shadow-lg)",
	color: "var(--color-text)",
};
const CHART_TOOLTIP_LABEL = {
	color: "var(--color-text)",
	fontWeight: 700,
};
const CHART_TOOLTIP_ITEM = {
	color: "var(--color-text-secondary)",
};
const SKELETON_HEIGHTS = [44, 72, 58, 86, 64, 78, 50, 68, 54, 82, 60, 74];

function formatChartValue(value: unknown): string {
	const numeric =
		typeof value === "number"
			? value
			: typeof value === "string"
				? Number(value)
				: NaN;

	return Number.isFinite(numeric) ? formatCompact(numeric) : String(value);
}

function formatDateLabel(date: string): string {
	const d = new Date(date);
	return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatEmotionName(emotion: string): string {
	return emotion.charAt(0) + emotion.slice(1).toLowerCase();
}

function getEmotionColor(emotion: string): string {
	const key = emotion.toLowerCase();
	const colors: Record<string, string> = {
		joy: "var(--mood-enjoyment)",
		enjoyment: "var(--mood-enjoyment)",
		sadness: "var(--mood-sadness)",
		anger: "var(--mood-anger)",
		anxiety: "var(--mood-fear)",
		fear: "var(--mood-fear)",
		surprise: "var(--mood-surprise)",
		disgust: "var(--mood-disgust)",
		neutral: "var(--mood-other)",
	};

	return colors[key] ?? "var(--mood-other)";
}

function ChartSkeleton({ bars = 12 }: { bars?: number }) {
	return (
		<div
			className="analytics-chart-skeleton"
			aria-hidden="true">
			{Array.from({ length: bars }).map((_, i) => (
				<span
					key={i}
					style={{
						height: `${SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]}%`,
					}}
				/>
			))}
		</div>
	);
}

function EmotionChart({ data }: { data: EmotionDistributionItem[] }) {
	if (data.length === 0) {
		return <p className="analytics-empty">No emotion data available.</p>;
	}

	const chartData = data.map((item) => ({
		name: formatEmotionName(item.emotion),
		count: item.count,
		color: getEmotionColor(item.emotion),
	}));

	return (
		<div
			className="analytics-chart-frame"
			style={{ height: `${Math.max(220, chartData.length * 40)}px` }}>
			<ResponsiveContainer
				width="100%"
				height="100%">
				<BarChart
					data={chartData}
					layout="vertical"
					margin={{ top: 4, right: 18, left: 4, bottom: 4 }}>
					<CartesianGrid
						stroke={CHART_GRID}
						horizontal={false}
					/>
					<XAxis
						type="number"
						axisLine={false}
						tickLine={false}
						tick={{ fill: CHART_AXIS, fontSize: 11 }}
						tickFormatter={formatCompact}
						allowDecimals={false}
					/>
					<YAxis
						type="category"
						dataKey="name"
						width={84}
						axisLine={false}
						tickLine={false}
						tick={{ fill: CHART_AXIS, fontSize: 12 }}
					/>
					<Tooltip
						cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
						contentStyle={CHART_TOOLTIP}
						labelStyle={CHART_TOOLTIP_LABEL}
						itemStyle={CHART_TOOLTIP_ITEM}
						formatter={(value) => [
							formatChartValue(value),
							"Entries",
						]}
					/>
					<Bar
						dataKey="count"
						radius={[0, 8, 8, 0]}
						barSize={14}>
						{chartData.map((item) => (
							<Cell
								key={item.name}
								fill={item.color}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function GrowthChart({
	data,
	period,
	onPeriodChange,
	loading,
}: {
	data: GrowthData | null;
	period: GrowthPeriod;
	onPeriodChange: (p: GrowthPeriod) => void;
	loading: boolean;
}) {
	const PERIODS: GrowthPeriod[] = ["7d", "30d", "90d"];
	const points = data?.dataPoints ?? [];
	const chartData = points.map((point) => ({
		...point,
		label: formatDateLabel(point.date),
	}));
	const interval = period === "7d" ? 0 : period === "30d" ? 4 : 14;

	return (
		<div className="analytics-panel">
			<div className="analytics-panel__header">
				<h3 className="analytics-panel__title">User Growth</h3>
				<div className="growth-periods">
					{PERIODS.map((p) => (
						<button
							key={p}
							type="button"
							className={`growth-period-btn${period === p ? " growth-period-btn--active" : ""}`}
							onClick={() => onPeriodChange(p)}
							disabled={loading}>
							{p}
						</button>
					))}
				</div>
			</div>

			{loading ? (
				<div className="analytics-chart-frame analytics-chart-frame--growth">
					<ChartSkeleton bars={period === "7d" ? 7 : 12} />
				</div>
			) : points.length === 0 ? (
				<p className="analytics-empty">No growth data available.</p>
			) : (
				<div className="analytics-chart-frame analytics-chart-frame--growth">
					<ResponsiveContainer
						width="100%"
						height="100%">
						<AreaChart
							data={chartData}
							margin={{
								top: 8,
								right: 14,
								left: -14,
								bottom: 0,
							}}>
							<defs>
								<linearGradient
									id={`growthGradient-${period}`}
									x1="0"
									y1="0"
									x2="0"
									y2="1">
									<stop
										offset="5%"
										stopColor="var(--color-info)"
										stopOpacity={0.48}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-info)"
										stopOpacity={0.02}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								stroke={CHART_GRID}
								vertical={false}
							/>
							<XAxis
								dataKey="label"
								axisLine={false}
								tickLine={false}
								tick={{ fill: CHART_AXIS, fontSize: 11 }}
								interval={interval}
								minTickGap={10}
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fill: CHART_AXIS, fontSize: 11 }}
								tickFormatter={formatCompact}
								allowDecimals={false}
								width={44}
							/>
							<Tooltip
								cursor={{
									stroke: "rgba(116, 176, 255, 0.28)",
									strokeWidth: 1,
								}}
								contentStyle={CHART_TOOLTIP}
								labelStyle={CHART_TOOLTIP_LABEL}
								itemStyle={CHART_TOOLTIP_ITEM}
								formatter={(value) => [
									formatChartValue(value),
									"New users",
								]}
							/>
							<Area
								type="monotone"
								dataKey="newUsers"
								stroke="var(--color-info)"
								strokeWidth={2.5}
								fill={`url(#growthGradient-${period})`}
								dot={period === "7d"}
								activeDot={{ r: 5 }}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}

function UserStatusChart({
	users,
	loading,
}: {
	users: AdminStatsData["users"] | null;
	loading: boolean;
}) {
	if (loading) {
		return (
			<div className="analytics-panel analytics-panel--status">
				<h3 className="analytics-panel__title">User Status</h3>
				<div className="analytics-chart-frame analytics-chart-frame--donut">
					<ChartSkeleton bars={6} />
				</div>
			</div>
		);
	}

	if (!users || users.total === 0) {
		return (
			<div className="analytics-panel analytics-panel--status">
				<h3 className="analytics-panel__title">User Status</h3>
				<p className="analytics-empty">
					No user status data available.
				</p>
			</div>
		);
	}

	const chartData = [
		{
			name: "Active",
			value: users.active,
			color: "var(--color-success)",
		},
		{
			name: "Inactive",
			value: users.inactive,
			color: "var(--color-info)",
		},
	].filter((item) => item.value > 0);
	const activePercent = Math.round((users.active / users.total) * 100);

	return (
		<div className="analytics-panel analytics-panel--status">
			<h3 className="analytics-panel__title">User Status</h3>
			<div className="analytics-chart-frame analytics-chart-frame--donut">
				<ResponsiveContainer
					width="100%"
					height="100%">
					<PieChart>
						<Pie
							data={chartData}
							dataKey="value"
							nameKey="name"
							innerRadius={58}
							outerRadius={86}
							paddingAngle={4}
							stroke="var(--color-bg-card)"
							strokeWidth={3}>
							{chartData.map((item) => (
								<Cell
									key={item.name}
									fill={item.color}
								/>
							))}
						</Pie>
						<Tooltip
							contentStyle={CHART_TOOLTIP}
							labelStyle={CHART_TOOLTIP_LABEL}
							itemStyle={CHART_TOOLTIP_ITEM}
							formatter={(value) => [
								formatChartValue(value),
								"Users",
							]}
						/>
						<text
							x="50%"
							y="47%"
							textAnchor="middle"
							dominantBaseline="middle"
							className="user-status-chart__value">
							{activePercent}%
						</text>
						<text
							x="50%"
							y="59%"
							textAnchor="middle"
							dominantBaseline="middle"
							className="user-status-chart__label">
							active
						</text>
					</PieChart>
				</ResponsiveContainer>
			</div>
			<div className="user-status-legend">
				{chartData.map((item) => (
					<div
						key={item.name}
						className="user-status-legend__item">
						<span
							className="user-status-legend__dot"
							style={{ background: item.color }}
						/>
						<span>{item.name}</span>
						<strong>{formatCompact(item.value)}</strong>
					</div>
				))}
			</div>
		</div>
	);
}

function KeywordChart({ data }: { data: TopKeyword[] }) {
	if (data.length === 0) {
		return <p className="analytics-empty">No keyword data available.</p>;
	}

	const chartData = data.slice(0, 10).map((kw) => ({
		name: kw.keyword,
		count: kw.count,
	}));

	return (
		<div
			className="analytics-chart-frame"
			style={{ height: `${Math.max(240, chartData.length * 34)}px` }}>
			<ResponsiveContainer
				width="100%"
				height="100%">
				<BarChart
					data={chartData}
					layout="vertical"
					margin={{ top: 4, right: 18, left: 4, bottom: 4 }}>
					<CartesianGrid
						stroke={CHART_GRID}
						horizontal={false}
					/>
					<XAxis
						type="number"
						axisLine={false}
						tickLine={false}
						tick={{ fill: CHART_AXIS, fontSize: 11 }}
						tickFormatter={formatCompact}
						allowDecimals={false}
					/>
					<YAxis
						type="category"
						dataKey="name"
						width={112}
						axisLine={false}
						tickLine={false}
						tick={{ fill: CHART_AXIS, fontSize: 12 }}
					/>
					<Tooltip
						cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
						contentStyle={CHART_TOOLTIP}
						labelStyle={CHART_TOOLTIP_LABEL}
						itemStyle={CHART_TOOLTIP_ITEM}
						formatter={(value) => [
							formatChartValue(value),
							"Mentions",
						]}
					/>
					<Bar
						dataKey="count"
						fill="var(--color-accent)"
						radius={[0, 8, 8, 0]}
						barSize={14}
					/>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

export default function AnalyticsPage() {
	const [stats, setStats] = useState<AdminStatsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [lastUpdated, setLastUpdated] = useState<string | null>(null);

	const [growthData, setGrowthData] = useState<GrowthData | null>(null);
	const [growthLoading, setGrowthLoading] = useState(false);
	const [growthPeriod, setGrowthPeriod] = useState<GrowthPeriod>("30d");

	const fetchGrowthData = useCallback(async (period: GrowthPeriod) => {
		setGrowthLoading(true);
		try {
			const data = await dashboardService.getGrowthData(period);
			setGrowthData(data);
		} catch {
			setGrowthData(null);
		} finally {
			setGrowthLoading(false);
		}
	}, []);

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
		void fetchGrowthData("30d");
	}, [fetchData, fetchGrowthData]);

	const handleGrowthPeriodChange = (period: GrowthPeriod) => {
		setGrowthPeriod(period);
		void fetchGrowthData(period);
	};

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

			<section className="analytics-section">
				<div className="analytics-section__header">
					<h3 className="analytics-section__title">User Analytics</h3>
				</div>
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
							<span className="summary-card__label">
								Inactive
							</span>
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
							<span className="summary-card__label">
								New today
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(stats?.users.newToday ?? 0)}
							</span>
						</div>
					</div>

					<div className="analytics-chart-grid analytics-chart-grid--users">
						<GrowthChart
							data={growthData}
							period={growthPeriod}
							onPeriodChange={handleGrowthPeriodChange}
							loading={growthLoading}
						/>
						<UserStatusChart
							users={stats?.users ?? null}
							loading={loading}
						/>
					</div>
				</div>
			</section>

			<section className="analytics-section">
				<div className="analytics-section__header">
					<h3 className="analytics-section__title">
						Content Analytics
					</h3>
				</div>
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
							<span className="summary-card__label">
								This week
							</span>
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
							<span className="summary-card__label">
								Analyzed
							</span>
							<span className="summary-card__value">
								{loading
									? "—"
									: formatCompact(
											stats?.entries.analyzed ?? 0,
										)}
							</span>
						</div>
					</div>

					<div className="analytics-chart-grid">
						<div className="analytics-panel">
							<h3 className="analytics-panel__title">
								Emotion Distribution
							</h3>
							<EmotionChart
								data={stats?.emotionDistribution ?? []}
							/>
						</div>

						{/* <div className="analytics-panel">
							<h3 className="analytics-panel__title">
								Top Keywords
							</h3>
							<KeywordChart data={stats?.topKeywords ?? []} />
						</div> */}
					</div>
				</div>
			</section>
		</div>
	);
}
