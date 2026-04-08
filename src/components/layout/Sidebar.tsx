import { type ReactNode, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "@/constants";
import "./Sidebar.css";

/* ── SVG icon set ── */
const Icons = {
	overview: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="3" y="3" width="7" height="7" rx="1" />
			<rect x="14" y="3" width="7" height="7" rx="1" />
			<rect x="3" y="14" width="7" height="7" rx="1" />
			<rect x="14" y="14" width="7" height="7" rx="1" />
		</svg>
	),
	analytics: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
		</svg>
	),
	users: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		</svg>
	),
	music: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M9 18V5l12-2v13" />
			<circle cx="6" cy="18" r="3" />
			<circle cx="18" cy="16" r="3" />
		</svg>
	),
	notifications: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
			<path d="M13.73 21a2 2 0 0 1-3.46 0" />
		</svg>
	),
	system: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
			<polyline points="16 17 22 17 22 11" />
		</svg>
	),
	chevronLeft: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
			<polyline points="15 18 9 12 15 6" />
		</svg>
	),
	chevronRight: (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
			<polyline points="9 18 15 12 9 6" />
		</svg>
	),
	brandMark: (
		<svg viewBox="0 0 32 32" fill="none">
			<defs>
				<linearGradient id="brand-grad" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="hsl(243,75%,72%)" />
					<stop offset="100%" stopColor="hsl(262,83%,72%)" />
				</linearGradient>
			</defs>
			<circle cx="16" cy="16" r="14" fill="url(#brand-grad)" opacity="0.15" />
			<path d="M10 20V12l6 5 6-5v8" stroke="url(#brand-grad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
			<circle cx="22" cy="20" r="2" fill="url(#brand-grad)" />
		</svg>
	),
};

const STORAGE_KEY = "moodadmin_sidebar_collapsed";

const mainNav = [
	{ to: ROUTES.DASHBOARD, label: "Overview", icon: Icons.overview },
	{ to: ROUTES.ANALYTICS, label: "Analytics", icon: Icons.analytics },
];
const manageNav = [
	{ to: ROUTES.USERS, label: "Users", icon: Icons.users },
	{ to: ROUTES.MUSIC, label: "Music", icon: Icons.music },
];
const opsNav = [
	{ to: ROUTES.NOTIFICATIONS, label: "Notifications", icon: Icons.notifications },
	{ to: ROUTES.SYSTEM, label: "System", icon: Icons.system },
];

function NavGroup({
	label,
	items,
	collapsed,
}: {
	label: string;
	items: { to: string; label: string; icon: ReactNode }[];
	collapsed: boolean;
}) {
	return (
		<div className="sidebar__group">
			{!collapsed && <span className="sidebar__group-label">{label}</span>}
			{items.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					className={({ isActive }) =>
						`sidebar__nav-item${isActive ? " sidebar__nav-item--active" : ""}${collapsed ? " sidebar__nav-item--collapsed" : ""}`
					}
					title={collapsed ? item.label : undefined}
				>
					<span className="sidebar__nav-icon">{item.icon}</span>
					{!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
					{collapsed && <span className="sidebar__nav-tooltip">{item.label}</span>}
				</NavLink>
			))}
		</div>
	);
}

export default function Sidebar() {
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		try {
			return localStorage.getItem(STORAGE_KEY) === "true";
		} catch {
			return false;
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, String(collapsed));
		} catch {
			// ignore
		}
		// Notify layout via CSS custom property on :root
		document.documentElement.setAttribute(
			"data-sidebar-collapsed",
			String(collapsed),
		);
	}, [collapsed]);

	// Set initial attribute on mount
	useEffect(() => {
		document.documentElement.setAttribute(
			"data-sidebar-collapsed",
			String(collapsed),
		);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
			{/* Brand */}
			<div className="sidebar__brand">
				<span className="sidebar__brand-icon">{Icons.brandMark}</span>
				{!collapsed && (
					<span className="sidebar__brand-name">MoodNote</span>
				)}
			</div>

			{/* Nav */}
			<nav className="sidebar__nav">
				<NavGroup label="Dashboard" items={mainNav} collapsed={collapsed} />
				<NavGroup label="Management" items={manageNav} collapsed={collapsed} />
				<NavGroup label="Operations" items={opsNav} collapsed={collapsed} />
			</nav>

			{/* Footer / Toggle */}
			<div className="sidebar__footer">
				{!collapsed && (
					<span className="sidebar__version">v2.0</span>
				)}
				<button
					type="button"
					className="sidebar__toggle"
					onClick={() => setCollapsed((c) => !c)}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
					title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? Icons.chevronRight : Icons.chevronLeft}
				</button>
			</div>
		</aside>
	);
}
