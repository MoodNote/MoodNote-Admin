import { NavLink } from "react-router-dom";
import { ROUTES } from "@/constants";
import "./Sidebar.css";

const mainNav = [
	{ to: ROUTES.DASHBOARD, label: "Overview", icon: "📊" },
	{ to: ROUTES.ANALYTICS, label: "Analytics", icon: "📈" },
];

const manageNav = [
	{ to: ROUTES.USERS, label: "Users", icon: "👥" },
	{ to: ROUTES.MUSIC, label: "Music", icon: "🎵" },
];

const opsNav = [
	{ to: ROUTES.NOTIFICATIONS, label: "Notifications", icon: "🔔" },
	{ to: ROUTES.SYSTEM, label: "System", icon: "🏥" },
];

function NavGroup({
	label,
	items,
}: {
	label: string;
	items: { to: string; label: string; icon: string }[];
}) {
	return (
		<div className="sidebar__group">
			<span className="sidebar__group-label">{label}</span>
			{items.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					className={({ isActive }) =>
						`sidebar__nav-item${isActive ? " sidebar__nav-item--active" : ""}`
					}>
					<span className="sidebar__nav-icon">{item.icon}</span>
					<span className="sidebar__nav-label">{item.label}</span>
				</NavLink>
			))}
		</div>
	);
}

export default function Sidebar() {
	return (
		<aside className="sidebar">
			<div className="sidebar__brand">
				<span className="sidebar__brand-icon">🎵</span>
				<span className="sidebar__brand-name">MoodNote</span>
			</div>

			<nav className="sidebar__nav">
				<NavGroup label="Dashboard" items={mainNav} />
				<NavGroup label="Management" items={manageNav} />
				<NavGroup label="Operations" items={opsNav} />
			</nav>

			<div className="sidebar__footer">
				<span className="sidebar__version">v2.0</span>
			</div>
		</aside>
	);
}
