import { NavLink } from "react-router-dom";
import { ROUTES } from "@/constants";
import "./Sidebar.css";

const navItems = [
	{ to: ROUTES.DASHBOARD, label: "Dashboard", icon: "📊" },
	{ to: ROUTES.USERS, label: "Users", icon: "👥" },
	{ to: ROUTES.MUSIC, label: "Music", icon: "🎵" },
	{ to: ROUTES.NOTIFICATIONS, label: "Notifications", icon: "🔔" },
];

export default function Sidebar() {
	return (
		<aside className="sidebar">
			<div className="sidebar__brand">
				<span className="sidebar__brand-icon">🎵</span>
				<span className="sidebar__brand-name">MoodNote</span>
			</div>

			<nav className="sidebar__nav">
				{navItems.map((item) => (
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
			</nav>
		</aside>
	);
}
